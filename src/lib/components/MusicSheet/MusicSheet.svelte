<script lang="ts">
  import { untrack } from 'svelte';
  import type { Attachment } from 'svelte/attachments';
  import * as mLib from '$lib/xmlplay/xmlplay_lib.js';
  import * as sLib from '$lib/xmlplay/xmlplay_syn.js';
  import commonAbc from '$lib/xmlplay/common.abc?raw';
  import { loadAbc2svg, createLogerr, preprocessAbc, type Abc2Svg } from '$lib/xmlplay/engine';
  import { LoadingSpinner } from '$lib/components/LoadingSpinner';

  let abc2svg: Abc2Svg | null = null;
  let Abc: unknown = null;

  type Props = {
    abc: string;
    voices: number[];
    speed: number;
    isPlaying: boolean;
    onLoad?: (initialVoices: number[]) => void;
    onBpmChange?: (bpm: number) => void;
    onPlayingChange?: (playing: boolean) => void;
    onError?: (message: string) => void;
    // Fired when a note in the rendered sheet is clicked, with its character
    // offset into `abc` (already adjusted for the prepended common header).
    onNoteClick?: (offset: number) => void;
  };

  let { abc, voices, speed, isPlaying, onLoad, onBpmChange, onPlayingChange, onError, onNoteClick }: Props = $props();

  // abcElm: engine host DOM element. Set by the {@attach initEngine} on mount;
  // not reactive (the engine mutates it imperatively).
  let abcElm: HTMLDivElement | null = null;
  let loading = $state(true);

  // Re-render trigger. canRender flips true once the abc2svg module is loaded;
  // the render effect then (re)lays out the score whenever `abc` changes — this
  // is what makes live editing work. firstRender renders immediately; later
  // edits are debounced.
  let canRender = $state(false);
  let firstRender = true;
  const renderDebounceMs = 350;

  // Engine state — non-reactive, mutated imperatively
  let audioCtx: AudioContext | null = null;
  let mapTab: Record<string, unknown> = {};
  // Web Audio capability flags, set once during init from audioCtx feature detection.
  const caps = { withRT: true, hasPan: true, hasLFO: true, hasFlt: true, hasVCF: true };
  // Identity instrument map (this port has no per-voice instrument remapping).
  const instMap = Array.from({ length: 256 }, (_, i) => i);
  let cmpElm: HTMLDivElement | null = null;

  const opt = {
    curmsk: 0,
    sf2url1: '/js3/',
    sf2url2: 'https://wim.vree.org/js3/',
    instTab: {},
    midijsUrl1: '/',
    midijsUrl2: 'https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/',
    instList: {},
    transMap: {},
    burak: 0,
    nosm: 0,
    noDash: 0,
    arpmaxdur: 36
  };

  const logerr = createLogerr((msg) => onError?.(msg));

  function setSynVars() {
    sLib.setSynVars(
      audioCtx,
      opt,
      mLib.midiVol,
      mLib.midiPan,
      mLib.midiInstr,
      mLib.midiUsedArr,
      caps.withRT,
      caps.hasPan,
      caps.hasLFO,
      caps.hasFlt,
      caps.hasVCF,
      instMap,
      cmpElm,
      logerr
    );
  }

  function resizeNotation() {
    if (!abcElm) return;
    abcElm.style.height = '100%';
    if (mLib.ntsSeq.length) mLib.putMarkLoc(mLib.ntsSeq[mLib.iSeq], 2);
  }

  // playBack: triggered by user clicks in the SVG margin or on a note. Just
  // toggles our isPlaying state; the $effect below drives the engine.
  function playBack() {
    if (!mLib.ntsSeq.length) return;
    onPlayingChange?.(!isPlaying);
  }

  function addUnlockListener(elm: HTMLElement, type: string, handler: EventListener) {
    function unlockAudio() {
      elm.removeEventListener('mousedown', unlockAudio);
      elm.removeEventListener('touchend', unlockAudio);
      if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    }
    elm.addEventListener('mousedown', unlockAudio);
    elm.addEventListener('touchend', unlockAudio);
    elm.addEventListener(type, handler);
  }

  function dolayout(abctxt: string) {
    if (!abc2svg) return;
    const getPlaying = () => isPlaying;
    abctxt = preprocessAbc(abc2svg, abctxt);
    let voiceMapNames: Record<string, number> = {};
    if (abctxt.includes('%%map')) {
      const [vmn, mt] = mLib.mapPerc(abctxt) as [Record<string, number>, Record<string, unknown>];
      voiceMapNames = vmn;
      mapTab = mt;
    }
    let abctxtTemp = abctxt;
    for (const vmapnm in voiceMapNames) {
      const nm1 = `%%voicemap ${vmapnm}`;
      const nm2 = nm1.replace('%voicemap', '_________');
      abctxtTemp = abctxtTemp.replaceAll(nm1, nm2);
    }
    mLib.doModel(Abc, abctxtTemp, opt, 120, 0, mapTab, logerr);
    setSynVars();
    sLib.laadNoot();
    mLib.doLayout(Abc, abctxt, opt, null, 1, abcElm, logerr, addUnlockListener, getPlaying, playBack, dolayout);
  }

  // Lay out (or re-lay out) the score for the current abc text. Stops any active
  // playback first — markeer() indexes into ntsSeq, which dolayout rebuilds, so
  // playing across a re-render would read a stale sequence. untrack so the
  // reactive reads here (isPlaying via the engine, state writes) don't widen the
  // render effect's dependencies.
  function renderNow(text: string) {
    untrack(() => {
      try {
        mLib.stop_markeer();
        onPlayingChange?.(false);
        dolayout(commonAbc + text);
        onLoad?.(mLib.getVolumes());
        resizeNotation();
      } catch (e) {
        onError?.(e instanceof Error ? e.message : String(e));
      } finally {
        loading = false; // clear the spinner even if the first render throws
      }
    });
  }

  // Highlight/scroll to the note matching an editor cursor offset. The offset is
  // into `abc`; the engine indexes into `commonAbc + abc`, so add the header length.
  export function highlightSource(offset: number) {
    mLib.markBySourceOffset(offset + commonAbc.length);
  }

  function keyDown(e: KeyboardEvent) {
    // Don't hijack keys (space = play, arrows = navigate) while the user is
    // typing in a form field or editor — let them reach the input.
    const t = e.target as HTMLElement | null;
    if (t && (t.isContentEditable || t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT'))
      return;
    if (e.altKey || e.ctrlKey || e.shiftKey || e.key === 'Tab') return;
    switch (e.key) {
      case 'ArrowLeft':
      case 'Left':
        e.preventDefault();
        mLib.naarMaat(-1);
        break;
      case 'ArrowRight':
      case 'Right':
        e.preventDefault();
        mLib.naarMaat(1);
        break;
      case 'ArrowUp':
      case 'Up':
        e.preventDefault();
        mLib.regelOmhoog(-1);
        break;
      case 'ArrowDown':
      case 'Down':
        e.preventDefault();
        mLib.regelOmhoog(1);
        break;
      case ' ':
        e.preventDefault();
        playBack();
        break;
    }
  }

  // One-time engine setup, as an attachment. Rendering lives in scheduleRender,
  // so this body reads no reactive state — the attachment runs once on mount and
  // never re-runs, hence no untrack wrapper or re-entry guard. The returned
  // function runs on unmount.
  const initEngine: Attachment<HTMLDivElement> = (node) => {
    abcElm = node;
    mLib.addElms();
    cmpElm = document.createElement('div');

    const hasSmooth = CSS.supports('scroll-behavior', 'smooth');
    if (!hasSmooth) opt.nosm = 1;

    const ac =
      window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    audioCtx = ac ? new ac() : null;

    const warnings: string[] = [];
    if (!hasSmooth) warnings.push('* smooth scrolling');
    if (!audioCtx) {
      warnings.push('* the Web Audio API -> no sound');
    } else {
      if (!audioCtx.createStereoPanner) caps.hasPan = false;
      if (!audioCtx.createOscillator) caps.hasLFO = false;
      if (!audioCtx.createBiquadFilter) caps.hasFlt = false;
      if (!audioCtx.createConstantSource) caps.hasVCF = false;
      if (!caps.hasPan) warnings.push('* the StereoPanner element');
      if (caps.withRT && !caps.hasLFO) warnings.push('* the Oscillator element');
      if (caps.withRT && !caps.hasFlt) warnings.push('* the BiquadFilter element');
      if (caps.withRT && !caps.hasVCF) warnings.push('* the ConstantSource element');
      if (!caps.hasLFO || !caps.hasFlt || !caps.hasVCF) {
        warnings.push('You are probably on iOS, which does not support the Web Audio API.');
        warnings.push('Real time synthesis is switched off, falling back to MIDIjs');
        caps.withRT = false;
      }
    }

    const resizeHandler = () => {
      mLib.setScale();
      resizeNotation();
    };
    window.addEventListener('resize', resizeHandler);

    // Tempo callback: the forked xmlplay_lib.js calls this as the playhead crosses
    // notes / the user seeks across the score.
    mLib.setOnTempo((tmp: number) => onBpmChange?.(tmp));

    // Note-click callback: offsets are into `commonAbc + abc`, so subtract the
    // header length to map back into `abc`. Clicks inside the header map to a
    // negative offset and are ignored.
    mLib.setOnNoteClick((offset: number) => {
      const inAbc = offset - commonAbc.length;
      if (inAbc >= 0) onNoteClick?.(inAbc);
    });

    document.body.addEventListener('keydown', keyDown);

    (async () => {
      abc2svg = await loadAbc2svg();
      Abc = abc2svg.Abc;
      canRender = true; // triggers the render effect's first (immediate) render
      if (warnings.length) onError?.('Your browser does not support:\n' + warnings.join('\n'));
    })();

    return () => {
      window.removeEventListener('resize', resizeHandler);
      mLib.setOnTempo(null);
      mLib.setOnNoteClick(null);
      document.body.removeEventListener('keydown', keyDown);
    };
  };

  // Sync volume changes from props into the engine. setVolume writes into the
  // stable midiVol array the synth reads live per note, so no setSynVars() is
  // needed. `voices` is read in full each run, so every change is tracked.
  $effect(() => {
    for (let i = 0; i < voices.length; i++) {
      mLib.setVolume(i, voices[i]);
    }
  });

  // Drive engine play/stop from isPlaying.
  $effect(() => {
    // Read `isPlaying` BEFORE the early return so it's always tracked as a
    // dependency. The guard reads non-reactive vendor state (`ntsSeq`), so on
    // the first run (before the song finishes rendering) we'd otherwise bail
    // without ever reading `isPlaying` — and the effect would never re-run when
    // the user hits play. ntsSeq is only populated after a render, which implies
    // the engine (and audioCtx) is fully set up, so no separate ready flag.
    const playing = isPlaying;
    if (!mLib.ntsSeq.length) return;
    if (playing) {
      if (audioCtx?.state === 'suspended') audioCtx.resume();
      mLib.start_markeer(audioCtx);
    } else {
      mLib.stop_markeer();
    }
  });

  // Push speed changes into the engine; read live each playback tick in
  // markeer(), so mid-song changes apply immediately.
  $effect(() => {
    mLib.setTempo(speed);
  });

  // Re-render the score whenever `abc` changes (live editing). `abc` and
  // `canRender` are both read up front so the effect tracks them. First render
  // is immediate; subsequent edits are debounced, and the returned cleanup
  // clears a pending timer when `abc` changes again or the component unmounts.
  $effect(() => {
    const text = abc;
    if (!canRender) return;
    if (firstRender) {
      firstRender = false;
      renderNow(text);
      return;
    }
    const timer = setTimeout(() => renderNow(text), renderDebounceMs);
    return () => clearTimeout(timer);
  });
</script>

{#if loading}
  <LoadingSpinner />
{/if}

<div class="size-full overflow-auto" {@attach initEngine}></div>
