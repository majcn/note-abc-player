<script lang="ts">
  interface Props {
    isPlaying: boolean;
    onRequestPlay: (isPlaying: boolean) => void;
  }

  let { isPlaying, onRequestPlay }: Props = $props();
</script>

<!--
  Round accent-colored button with a white play/stop glyph (inline SVG).
    flex items-center justify-center   center the svg inside
    size-[34px] / max-md:size-11       34x34 desktop, 44x44 tap target on mobile
    shrink-0                           never compress in the flex row
    rounded-full bg-panel-accent       green circle, brighter on hover
    text-white                         icon color (svg paths use fill="currentColor")
    motion-safe:hover:scale-105        1.05x pop on hover (skipped for reduced-motion)
    focus-visible:outline-white        white ring on keyboard focus (matches dark accent)
  The svg itself is 22px (26px on mobile) to match the old mask-size.
-->
<button
  type="button"
  class="flex size-[34px] shrink-0 cursor-pointer items-center justify-center rounded-full bg-panel-accent text-white transition hover:bg-panel-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-safe:hover:scale-105 max-md:size-11"
  aria-label={isPlaying ? 'Stop' : 'Play'}
  aria-pressed={isPlaying}
  onclick={() => onRequestPlay(!isPlaying)}
>
  {#if isPlaying}
    <!-- @material-design-icons/svg/filled/stop.svg, inlined -->
    <svg viewBox="0 0 24 24" class="size-[22px] max-md:size-[26px]" fill="currentColor" aria-hidden="true">
      <path d="M6 6h12v12H6z" />
    </svg>
  {:else}
    <!-- @material-design-icons/svg/filled/play_arrow.svg, inlined -->
    <svg viewBox="0 0 24 24" class="size-[22px] max-md:size-[26px]" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  {/if}
</button>
