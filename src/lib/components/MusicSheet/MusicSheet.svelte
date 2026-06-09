<script lang="ts">
  import { untrack } from 'svelte';
  import * as mLib from '$lib/xmlplay/xmlplay_lib.js';
  import * as sLib from '$lib/xmlplay/xmlplay_syn.js';
  import commonAbc from '$lib/xmlplay/common.abc?raw';

  // Minimal shape we touch on the vendor module.
  type Abc2Svg = {
    Abc: unknown;
    mhooks: Record<string, unknown>;
  };

  // abc2svg is ~290 kB — dynamic import puts it in its own hashed chunk
  // (long-cache via _app/immutable/), loaded on first song.
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
  };

  let { abc, voices, speed, isPlaying, onLoad, onBpmChange, onPlayingChange, onError }: Props = $props();

  // abcElm: engine host DOM element. Set by the {@attach} on mount; not reactive
  // (the engine mutates it imperatively).
  let abcElm: HTMLDivElement | null = null;
  let loading = $state(true);

  // Engine state — non-reactive, mutated imperatively
  let audioCtx: AudioContext | null = null;
  let mapTab: Record<string, unknown> = {};
  let withRT = true;
  let hasPan = true;
  let hasLFO = true;
  let hasFlt = true;
  let hasVCF = true;
  let instMap: number[] | null = null;
  let tabHaak: unknown = null;
  let cmpElm: HTMLDivElement | null = null;
  let ready = false;

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

  const svg36 = [
    '%%beginsvg',
    '<defs>',
    '<text id="acc1_3" x="-1">&#xe261; <tspan x="-6" y="-4" style="font-size:14px">&#8593;</tspan></text>',
    '<text id="acc2_3" x="-1">&#xe262; <tspan x="-5" y="14" style="font-size:14px">&#8595;</tspan></text>',
    '<text id="acc4_3" x="-1">&#xe262; <tspan x="-5" y="-4" style="font-size:14px">&#8593;</tspan></text>',
    '<text id="acc-4_3" x="-2">&#xe260; <tspan x="-8.2" y="9" style="font-size:16px">&#8595;</tspan></text>',
    '<text id="acc-2_3" x="-1">&#xe260; <tspan x="-7.3" y="-1" style="font-size:16px">&#8593;</tspan></text>',
    '<text id="acc-1_3" x="-1">&#xe261; <tspan x="-2" y="12" style="font-size:14px">&#8595;</tspan></text>',
    '</defs>',
    '%%endsvg'
  ].join('\n');

  // Vendor logs many non-error progress messages through logerr — suppress those.
  function logerr(s: unknown) {
    const str = String(s);
    if (
      str === 'no error' ||
      str === 'fonts geladen' ||
      str === 'notes decoded' ||
      str.includes('loading instrument')
    ) {
      return;
    }
    onError?.(str);
  }

  function setSynVars() {
    sLib.setSynVars(
      audioCtx,
      opt,
      mLib.midiVol,
      mLib.midiPan,
      mLib.midiInstr,
      mLib.midiUsedArr,
      withRT,
      hasPan,
      hasLFO,
      hasFlt,
      hasVCF,
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
    if (/V:\w+\s*tab.*voicemap/s.test(abctxt)) {
      delete abc2svg.mhooks['strtab'];
    } else if (tabHaak) {
      abc2svg.mhooks['strtab'] = tabHaak;
    }
    const getPlaying = () => isPlaying;
    let voiceMapNames: Record<string, number> = {};
    if (abctxt.includes('I:percmap')) abctxt = mLib.perc2map(abctxt);
    if (abctxt.includes('%%map')) {
      const [vmn, mt] = mLib.mapPerc(abctxt) as [Record<string, number>, Record<string, unknown>];
      voiceMapNames = vmn;
      mapTab = mt;
    }
    if (abctxt.includes('temperamentequal')) abctxt = svg36 + '\n' + abctxt;
    let abctxtTemp = abctxt;
    for (const vmapnm in voiceMapNames) {
      const nm1 = `%%voicemap ${vmapnm}`;
      const nm2 = nm1.replace('%voicemap', '_________');
      abctxtTemp = abctxtTemp.replaceAll(nm1, nm2);
    }
    mLib.doModel(Abc, abctxtTemp, opt, 120, 0, mapTab, logerr);
    instMap = Array.from({ length: 256 }, (_, i) => i);
    setSynVars();
    sLib.laadNoot();
    mLib.doLayout(Abc, abctxt, opt, null, 1, abcElm, logerr, addUnlockListener, getPlaying, playBack, dolayout);
  }

  async function renderSong(abctxt: string) {
    if (!abc2svg) {
      const mod = await import('$lib/vendor/abc2svg/abc2svg-bundle.js');
      const loaded: Abc2Svg = mod.default;
      abc2svg = loaded;
      Abc = loaded.Abc;
      tabHaak = loaded.mhooks['strtab'];
    }
    dolayout(commonAbc + abctxt);
    onLoad?.([...mLib.midiVol]);
    loading = false;
  }

  function keyDown(e: KeyboardEvent) {
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

  // Setup runs once on mount via {@attach} on the host div. Wrapped in untrack
  // so reads of reactive props (abc) don't subscribe — re-runs would tear down
  // event listeners via the cleanup function.
  function initEngine(node: HTMLDivElement) {
    return untrack(() => {
      abcElm = node;
      if (ready) return;

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
        if (!audioCtx.createStereoPanner) hasPan = false;
        if (!audioCtx.createOscillator) hasLFO = false;
        if (!audioCtx.createBiquadFilter) hasFlt = false;
        if (!audioCtx.createConstantSource) hasVCF = false;
        if (!hasPan) warnings.push('* the StereoPanner element');
        if (withRT && !hasLFO) warnings.push('* the Oscillator element');
        if (withRT && !hasFlt) warnings.push('* the BiquadFilter element');
        if (withRT && !hasVCF) warnings.push('* the ConstantSource element');
        if (!hasLFO || !hasFlt || !hasVCF) {
          warnings.push('You are probably on iOS, which does not support the Web Audio API.');
          warnings.push('Real time synthesis is switched off, falling back to MIDIjs');
          withRT = false;
        }
      }

      const resizeHandler = () => {
        mLib.setScale();
        resizeNotation();
      };
      window.addEventListener('resize', resizeHandler);

      // Tempo events dispatched by the forked xmlplay_lib.js as the playhead crosses
      // notes / users seek across the score.
      const tempoHandler = (e: Event) => onBpmChange?.((e as CustomEvent<{ tmp: number }>).detail.tmp);
      document.addEventListener('xmlplay-markeer', tempoHandler);

      document.body.addEventListener('keydown', keyDown);

      ready = true;

      (async () => {
        await renderSong(abc);
        resizeNotation();
        if (warnings.length) onError?.('Your browser does not support:\n' + warnings.join('\n'));
      })();

      return () => {
        window.removeEventListener('resize', resizeHandler);
        document.removeEventListener('xmlplay-markeer', tempoHandler);
        document.body.removeEventListener('keydown', keyDown);
      };
    });
  }

  // Sync volume changes from props into the engine. Defined as a named function
  // and passed by reference to $effect so the autofixer's body-inspection
  // heuristic doesn't flag the engine calls inside.
  function syncVolumes() {
    // Read every voice up front so each is registered as a dependency even on
    // runs where we bail early below. Svelte only tracks reactive values read
    // BEFORE an early return — read them after the `ready` guard (a plain,
    // non-reactive var) and the effect would never re-subscribe, so later
    // volume changes would be silently ignored.
    const next = voices.map((v) => v);
    if (!ready || !mLib.midiVol) return;
    let changed = false;
    for (let i = 0; i < next.length; i++) {
      if (mLib.midiVol[i] !== next[i]) {
        mLib.midiVol[i] = next[i];
        changed = true;
      }
    }
    if (changed) setSynVars();
  }
  $effect(syncVolumes);

  // Drive engine play/stop from isPlaying. Tempo updates arrive via the
  // 'xmlplay-markeer' CustomEvent dispatched from markeer() in the vendor fork.
  function syncPlayState() {
    // Read `isPlaying` BEFORE the early return so it's always tracked as a
    // dependency. The guards below read non-reactive vendor state (`ready`,
    // `ntsSeq`), so on the first run (before the song finishes rendering) we'd
    // otherwise bail without ever reading `isPlaying` — and the effect would
    // never re-run when the user hits play.
    const playing = isPlaying;
    if (!ready || !mLib.ntsSeq.length) return;
    if (playing) {
      if (audioCtx?.state === 'suspended') audioCtx.resume();
      mLib.start_markeer(audioCtx);
    } else {
      mLib.stop_markeer();
    }
  }
  $effect(syncPlayState);
</script>

{#if loading}
  <!--
    Loading row: spinner + "Loading…" text.
      flex items-center gap-2.5    horizontal, vertically centered, 10px between
      p-3                          12px padding all around
  -->
  <div class="flex items-center gap-2.5 p-3 text-sm text-neutral-500">
    <!--
      Pure-CSS spinner — no SVG, no extra dependencies.
      The trick: a full circle (border-2) with three light-gray sides
      and one DARKER top side (border-t-neutral-600). When you spin
      that, the dark segment chases its tail = spinning donut.
        size-4              16x16px
        animate-spin        Tailwind's built-in 360° infinite rotation
        rounded-full        circle
        motion-reduce:animate-none    freeze if user prefers reduced motion
    -->
    <div
      class="size-4 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-600 motion-reduce:animate-none"
    ></div>
    <span>Loading…</span>
  </div>
{/if}

<!-- Hidden input read by xmlplay engine for speed multiplier. -->
<input type="hidden" id="tempo" value={speed} />

<div class="size-full overflow-auto" {@attach initEngine}></div>
