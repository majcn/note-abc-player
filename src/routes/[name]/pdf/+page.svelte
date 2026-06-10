<script lang="ts">
  import type { PageProps } from './$types';
  import { PrintSheet } from '$lib/components/PrintSheet';
  import { ErrorToast } from '$lib/components/ErrorToast';

  let { data }: PageProps = $props();

  let toast = $state<{ show: (msg: unknown) => void }>();
</script>

<svelte:head><title>{data.title} (Print mode)</title></svelte:head>

<!--
  Print-to-PDF view. The score is laid out into an on-screen A4 "paper" so what
  you see matches what prints; the browser's own print dialog ("Save as PDF")
  does the SVG→PDF conversion and handles paginating across A4 sheets natively —
  no extra dependency, and the music-notation glyph fonts render correctly.
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

<!--
  The "paper": A4 width with print margins faked as padding so the screen
  preview is faithful. @media print strips the chrome (shadow, gray backdrop,
  centering) and lets @page own the real margins.
-->
<div class="paper-wrap flex justify-center bg-neutral-100 p-4 print:block print:bg-white print:p-0">
  <div class="paper w-[210mm] bg-white p-[12mm] shadow-md print:w-auto print:p-0 print:shadow-none">
    {#key data.name}
      <PrintSheet abc={data.abc} onError={(msg) => toast?.show(msg)} />
    {/key}
  </div>
</div>

<ErrorToast bind:this={toast} />

<style>
  @media print {
    /* A4 sheets with comfortable margins; @page owns the printed margin so the
       paper element itself sits flush at the content-box edge. */
    @page {
      size: A4;
      margin: 12mm;
    }
    /* Keep a musical system (one <svg> block) from being split across a page
       boundary, and never overflow the printable width. */
    .paper :global(svg) {
      break-inside: avoid;
      max-width: 100%;
    }
  }
</style>
