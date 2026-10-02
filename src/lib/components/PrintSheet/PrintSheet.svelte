<script lang="ts">
  import type { Attachment } from 'svelte/attachments';
  import commonAbc from '$lib/xmlplay/common.abc?raw';
  import { loadAbc2svg, createLogerr, preprocessAbc, type Abc2Svg } from '$lib/xmlplay/engine';
  import { LoadingSpinner } from '$lib/components/LoadingSpinner';

  type Props = {
    abc: string;
    transpose?: number;
    onError?: (message: string) => void;
  };

  let { abc, transpose = 0, onError }: Props = $props();

  // Static, print-oriented sibling of MusicSheet: same abc2svg engine, visual
  // half only. abc2svg's page module typesets A4 sheets itself, so pagination
  // doesn't depend on the browser.
  let loading = $state(true);

  // Margins are part of the typeset page, so @page adds none (see pdf route).
  const pageAbc = [
    '%%pagewidth 21cm',
    '%%pageheight 29.7cm',
    '%%topmargin 1.2cm',
    '%%botmargin 1.2cm',
    '%%leftmargin 1.2cm',
    '%%rightmargin 1.2cm'
  ].join('\n');

  const logerr = createLogerr((msg) => onError?.(msg));

  // Visual-only render: with %%pageheight in `format`, the page module returns
  // one <div> per sheet. No listeners, no playback model.
  function renderPaged(abc2svg: Abc2Svg, format: string, abctxt: string): string {
    let out = '';
    let errtxt = '';
    const user = {
      imagesize: 'width="100%"',
      img_out: (str: string) => {
        out += str;
      },
      errmsg: (txt: string) => {
        errtxt += txt + '\n';
      },
      read_file: () => '',
      anno_start: null,
      get_abcmodel: null
    };
    const Abc = abc2svg.Abc as new (user: unknown) => { tosvg: (name: string, text: string) => void };
    abc2svg.abc_end = () => {};
    const abc = new Abc(user);
    abc.tosvg('fmt', format);
    abc.tosvg('abc2svg', abctxt);
    // Emits the last page's footer and closing </div>.
    abc2svg.abc_end();
    if (errtxt) logerr(errtxt.trim());
    return out;
  }

  // One-time render; no live editing here.
  const initEngine: Attachment<HTMLDivElement> = (node) => {
    (async () => {
      try {
        const abc2svg = await loadAbc2svg();
        const format = [pageAbc, commonAbc, transpose ? `%%transpose ${transpose}` : ''].join('\n');
        node.innerHTML = renderPaged(abc2svg, format, preprocessAbc(abc2svg, abc, true));
        for (const page of node.children) page.classList.add('abc-page');
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

<div class="flex flex-col items-center gap-4 print:block print:gap-0" {@attach initEngine}></div>

<style>
  /* One A4 sheet; SVGs are width="100%" of it, so this pins the printed scale. */
  :global(.abc-page) {
    width: 210mm;
    background: white;
  }

  @media screen {
    /* Engine stops at the bottom margin; pad the preview to a full sheet. */
    :global(.abc-page) {
      min-height: 297mm;
      box-shadow:
        0 1px 3px rgb(0 0 0 / 0.12),
        0 1px 2px rgb(0 0 0 / 0.24);
    }
  }
</style>
