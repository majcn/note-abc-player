<script lang="ts">
  import type { Attachment } from 'svelte/attachments';
  import * as mLib from '$lib/xmlplay/xmlplay_lib.js';
  import commonAbc from '$lib/xmlplay/common.abc?raw';

  // Minimal shape we touch on the vendor module.
  type Abc2Svg = {
    Abc: unknown;
    mhooks: Record<string, unknown>;
  };

  type Props = {
    abc: string;
    onError?: (message: string) => void;
  };

  let { abc, onError }: Props = $props();

  // Static, print-oriented sibling of MusicSheet: it runs the same abc2svg
  // layout engine but only the *visual* half — no AudioContext, no playback
  // model (doModel), no click/keyboard handlers. The SVG blocks are emitted at
  // their natural height so the page can flow and paginate across A4 sheets,
  // unlike MusicSheet which fills a fixed scrolling viewport.
  let abc2svg: Abc2Svg | null = null;
  let Abc: unknown = null;
  let tabHaak: unknown = null;
  let abcElm: HTMLDivElement | null = null;
  let loading = $state(true);

  // Same engine options as MusicSheet, minus the audio/synth concerns we never
  // reach here. noDash hides the playhead ruler that addElms() injects.
  const opt = {
    curmsk: 0,
    instTab: {},
    instList: {},
    transMap: {},
    burak: 0,
    nosm: 1,
    noDash: 1,
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
    if (str === 'no error' || str === 'fonts geladen' || str === 'notes decoded' || str.includes('loading instrument')) {
      return;
    }
    onError?.(str);
  }

  const noop = () => {};
  const notPlaying = () => false;

  // Visual-only layout: mirrors MusicSheet.dolayout's source preprocessing
  // (tab voicemap, percmap, equal-temperament glyphs) but renders with fplay=0
  // and no-op interaction hooks, so no playback sequence or listeners attach.
  function dolayout(abctxt: string) {
    if (!abc2svg || !abcElm) return;
    if (/V:\w+\s*tab.*voicemap/s.test(abctxt)) {
      delete abc2svg.mhooks['strtab'];
    } else if (tabHaak) {
      abc2svg.mhooks['strtab'] = tabHaak;
    }
    if (abctxt.includes('I:percmap')) abctxt = mLib.perc2map(abctxt);
    if (abctxt.includes('temperamentequal')) abctxt = svg36 + '\n' + abctxt;
    mLib.doLayout(Abc, abctxt, opt, null, 0, abcElm, logerr, noop, notPlaying, noop, dolayout);
  }

  async function loadAbc2svg() {
    if (abc2svg) return;
    const mod = await import('$lib/vendor/abc2svg/abc2svg-bundle.js');
    const loaded: Abc2Svg = mod.default;
    abc2svg = loaded;
    Abc = loaded.Abc;
    tabHaak = loaded.mhooks['strtab'];
  }

  // One-time setup + initial (and only) render. There is no live editing here,
  // so unlike MusicSheet there is no reactive re-render effect.
  const initEngine: Attachment<HTMLDivElement> = (node) => {
    abcElm = node;
    mLib.addElms();
    (async () => {
      try {
        await loadAbc2svg();
        dolayout(commonAbc + abc);
      } catch (e) {
        onError?.(e instanceof Error ? e.message : String(e));
      } finally {
        loading = false;
      }
    })();
  };
</script>

{#if loading}
  <div class="flex items-center gap-2.5 p-3 text-sm text-neutral-500 print:hidden">
    <div
      class="size-4 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-600 motion-reduce:animate-none"
    ></div>
    <span>Loading…</span>
  </div>
{/if}

<div {@attach initEngine}></div>
