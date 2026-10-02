<script lang="ts">
  import type { PageProps } from './$types';
  import { PrintSheet } from '#lib/components/PrintSheet/index.js';
  import { ErrorToast } from '#lib/components/ErrorToast/index.js';
  import { page } from '$app/state';
  import { parseTranspose } from '#lib/transposeParam.svelte.js';

  let { data }: PageProps = $props();

  let errorMsg = $state<string | null>(null);
  let transpose = $derived(parseTranspose(page.url.searchParams.get('t')));
</script>

<svelte:head><title>{data.title} (Print mode)</title></svelte:head>

<!--
  Print-to-PDF view. abc2svg typesets A4 sheets; the browser's print dialog
  ("Save as PDF") just puts one sheet per page and does the SVG→PDF conversion.
-->

<!-- Screen-only toolbar; @media print hides it so it never lands on the page. -->
<div
  class="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-neutral-200 bg-white/90 px-4 py-2.5 backdrop-blur print:hidden"
>
  <span class="truncate text-sm font-medium text-neutral-700">{data.name}</span>
  <button
    type="button"
    class="shrink-0 cursor-pointer rounded-md bg-neutral-800 px-3.5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-800"
    onclick={() => window.print()}
  >
    Save as PDF
  </button>
</div>

<div class="bg-neutral-100 p-4 print:bg-white print:p-0">
  {#key `${data.name}:${transpose}`}
    <PrintSheet abc={data.abc} {transpose} onError={(msg) => (errorMsg = msg)} />
  {/key}
</div>

<ErrorToast msg={errorMsg} onClose={() => (errorMsg = null)} />

<style>
  @media print {
    /* Typeset sheets include their margins. */
    @page {
      size: A4;
      margin: 0;
    }
  }
</style>
