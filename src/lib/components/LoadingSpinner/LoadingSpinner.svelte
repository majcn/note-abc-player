<script lang="ts">
  // Loading row: spinner + "Loading…" text. Shared by MusicSheet and PrintSheet
  // while the abc2svg engine chunk loads.
  let { class: className }: { class?: string } = $props();
</script>

<!--
  flex items-center gap-2.5    horizontal, vertically centered, 10px between
  p-3                          12px padding all around
-->
<div class={['flex items-center gap-2.5 p-3 text-sm text-neutral-500', className]}>
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
