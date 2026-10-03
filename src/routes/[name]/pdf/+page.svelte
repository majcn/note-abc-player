<script lang="ts">
  import type { PageProps } from './$types';
  import { PrintSheet } from '#lib/components/PrintSheet/index.js';
  import { ErrorToast } from '#lib/components/ErrorToast/index.js';
  import { page } from '$app/state';
  import { parseTranspose } from '#lib/transposeParam.svelte.js';
  import { resolve } from '$app/paths';

  let { data }: PageProps = $props();

  let errorMsg = $state<string | null>(null);
  let transpose = $derived(parseTranspose(page.url.searchParams.get('t')));
  let playerHref = $derived(resolve('/[name]', { name: data.name }) + (transpose ? `?t=${transpose}` : ''));
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
  <div class="flex shrink-0 items-center gap-2">
    <a
      href={playerHref}
      data-sveltekit-reload
      class="flex items-center gap-1.5 rounded-md border border-neutral-300 px-3.5 py-1.5 text-sm font-medium text-neutral-800 transition-colors hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-800"
    >
      <!-- @material-design-icons/svg/filled/music_note.svg, inlined -->
      <svg viewBox="0 0 24 24" class="size-[18px]" fill="currentColor" aria-hidden="true">
        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
      </svg>
      Predvajaj
    </a>
    <button
      type="button"
      class="flex cursor-pointer items-center gap-1.5 rounded-md bg-neutral-800 px-3.5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-800"
      onclick={() => window.print()}
    >
      <!-- @material-design-icons/svg/filled/print.svg, inlined -->
      <svg viewBox="0 0 24 24" class="size-[18px]" fill="currentColor" aria-hidden="true">
        <path
          d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"
        />
      </svg>
      Natisni
    </button>
  </div>
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
