<script lang="ts">
  import type { Attachment } from 'svelte/attachments';
  import * as mLib from '$lib/xmlplay/xmlplay_lib.js';
  import commonAbc from '$lib/xmlplay/common.abc?raw';
  import { loadAbc2svg, createLogerr, preprocessAbc, type Abc2Svg } from '$lib/xmlplay/engine';
  import { LoadingSpinner } from '$lib/components/LoadingSpinner';

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

  const logerr = createLogerr((msg) => onError?.(msg));

  const noop = () => {};
  const notPlaying = () => false;

  // Visual-only layout: mirrors MusicSheet.dolayout's source preprocessing
  // (tab voicemap, percmap, equal-temperament glyphs) but renders with fplay=0
  // and no-op interaction hooks, so no playback sequence or listeners attach.
  function dolayout(abctxt: string) {
    if (!abc2svg || !abcElm) return;
    abctxt = preprocessAbc(abc2svg, abctxt);
    mLib.doLayout(Abc, abctxt, opt, null, 0, abcElm, logerr, noop, notPlaying, noop, dolayout);
  }

  // One-time setup + initial (and only) render. There is no live editing here,
  // so unlike MusicSheet there is no reactive re-render effect.
  const initEngine: Attachment<HTMLDivElement> = (node) => {
    abcElm = node;
    mLib.addElms();
    (async () => {
      try {
        abc2svg = await loadAbc2svg();
        Abc = abc2svg.Abc;
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
  <LoadingSpinner class="print:hidden" />
{/if}

<div {@attach initEngine}></div>
