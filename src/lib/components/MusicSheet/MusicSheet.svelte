<script lang="ts">
  import abc2svg from '$lib/vendor/abc2svg/abc2svg-bundle.js';
  import * as mLib from '$lib/vendor/xmlplay/xmlplay_lib.js';
  import * as sLib from '$lib/vendor/xmlplay/xmlplay_syn.js';
  import commonAbc from '$lib/vendor/xmlplay/common.abc?raw';

  type Props = {
    song: string;
    voices: number[];
    speed: number;
    isPlaying: boolean;
    onLoad?: (initialVoices: number[]) => void;
    onBpmChange?: (bpm: number) => void;
    onPlayingChange?: (playing: boolean) => void;
    onError?: (message: string) => void;
  };

  let { song, voices, speed, isPlaying, onLoad, onBpmChange, onPlayingChange, onError }: Props = $props();

  let abcElm: HTMLDivElement | null = $state(null);
  let loading = $state(true);

  // Engine state — non-reactive, mutated imperatively
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let audioCtx: any = null;
  let mapTab: Record<string, unknown> = {};
  let withRT = true;
  let hasPan = true;
  let hasLFO = true;
  let hasFlt = true;
  let hasVCF = true;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let instMap: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let tabHaak: any = null;
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function addUnlockListener(elm: any, type: string, handler: any) {
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
    if (/V:\w+\s*tab.*voicemap/s.test(abctxt)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (abc2svg as any).mhooks['strtab'];
    } else if (tabHaak) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (abc2svg as any).mhooks['strtab'] = tabHaak;
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
    mLib.doModel(abctxtTemp, opt, 120, 0, mapTab, logerr);
    instMap = Array.from({ length: 256 }, (_, i) => i);
    setSynVars();
    sLib.laadNoot();
    mLib.doLayout(abctxt, opt, null, 1, abcElm, logerr, addUnlockListener, getPlaying, playBack, dolayout);
  }

  async function loadSong(name: string) {
    const url = `/abc/${name}.abc`;
    try {
      const res = await fetch(url);
      if (!res.ok) {
        onError?.(`Failed to load ${url}: ${res.status}`);
        return;
      }
      const abctxt = await res.text();
      if (!abctxt.includes('X:')) {
        onError?.('not a valid abc file');
        return;
      }
      dolayout(commonAbc + abctxt);
      onLoad?.([...mLib.midiVol]);
      loading = false;
    } catch (err) {
      logerr('preload failed');
      throw err;
    }
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

  $effect(() => {
    if (!abcElm || ready) return;

    // Upstream xmlplay_lib references a global `Abc` (the abc2svg engine constructor).
    // Expose it before any vendor call so vendor files stay pristine.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).Abc = (abc2svg as any).Abc;

    mLib.addElms();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tabHaak = (abc2svg as any).mhooks['strtab'];
    cmpElm = document.createElement('div');

    const hasSmooth = CSS.supports('scroll-behavior', 'smooth');
    if (!hasSmooth) opt.nosm = 1;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ac = window.AudioContext || (window as any).webkitAudioContext;
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

    // Tempo events come from a small local patch to xmlplay_lib.js — see
    // scripts/patches/xmlplay_lib.patch.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tempoHandler = (e: any) => onBpmChange?.(e.detail.tmp);
    document.addEventListener('xmlplay-tempo', tempoHandler);

    document.body.addEventListener('keydown', keyDown);

    ready = true;

    (async () => {
      await loadSong(song);
      resizeNotation();
      if (warnings.length) onError?.('Your browser does not support:\n' + warnings.join('\n'));
    })();

    return () => {
      window.removeEventListener('resize', resizeHandler);
      document.removeEventListener('xmlplay-tempo', tempoHandler);
      document.body.removeEventListener('keydown', keyDown);
    };
  });

  // Sync volume changes from props into the engine.
  $effect(() => {
    if (!ready || !mLib.midiVol) return;
    let changed = false;
    for (let i = 0; i < voices.length; i++) {
      if (mLib.midiVol[i] !== voices[i]) {
        mLib.midiVol[i] = voices[i];
        changed = true;
      }
    }
    if (changed) setSynVars();
  });

  // Drive engine play/stop from isPlaying. Tempo updates arrive via the
  // 'xmlplay-tempo' CustomEvent dispatched from the patched markeer().
  $effect(() => {
    if (!ready || !mLib.ntsSeq.length) return;
    if (isPlaying) {
      if (audioCtx?.state === 'suspended') audioCtx.resume();
      mLib.start_markeer(audioCtx);
    } else {
      mLib.stop_markeer();
    }
  });
</script>

{#if loading}
  <pre class="wait">Loading, please wait …</pre>
{/if}

<!-- Hidden input read by xmlplay engine for speed multiplier. -->
<input type="hidden" id="tempo" value={speed} />

<div class="notation" bind:this={abcElm}></div>

<style>
  .notation {
    width: 100%;
    height: 100%;
    overflow: auto;
    display: inline-block;
    vertical-align: top;
  }

  .wait {
    padding: 12px;
    color: var(--color-text-secondary, #888);
  }
</style>
