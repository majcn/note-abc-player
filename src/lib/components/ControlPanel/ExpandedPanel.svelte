<script lang="ts">
  const VOICE_NAMES = ['Prvi glas', 'Drugi glas', 'Tretji glas', 'Četrti glas'];

  interface Props {
    open: boolean;
    voices: number[];
    speed: number;
    speedMin: number;
    speedMax: number;
    onVolumeChange: (i: number, val: number) => void;
    onSpeedChange: (v: number) => void;
  }

  let { open, voices, speed, speedMin, speedMax, onVolumeChange, onSpeedChange }: Props = $props();

  // Math.round needed: IEEE 754 float imprecision, e.g. 1.12 * 100 = 112.99999999999999
  let speedPercentage = $derived(Math.round(speed * 100));
  let speedMinPercentage = $derived(Math.round(speedMin * 100));
  let speedMaxPercentage = $derived(Math.round(speedMax * 100));

  // Style strings reused across all rows. Pulled out so each row stays readable.
  //   row    horizontal layout, vertically centered, 8px gap between cells
  //   label  left column, fixed 76px min-width so all rows line up
  //   slider native <input range>; accent-* recolors the thumb/track; flex-1 = grow
  //   pct    right column, fixed 54px width so the % numbers align in a column
  const row = 'flex items-center gap-2';
  const label = 'min-w-[76px] text-xs whitespace-nowrap text-panel-text-muted';
  const slider =
    'flex-1 cursor-pointer accent-panel-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-panel-accent';
  const pct = 'w-[54px] shrink-0 text-right text-xs text-panel-text-dim';
</script>

<!--
  Expand/collapse trick using CSS grid:
    - The grid has ONE row that animates between `0fr` (zero height) and `1fr` (full).
    - The child uses `overflow-hidden` so when the row is 0fr, content is clipped to 0px.
    - This is the only way to animate "auto" height in pure CSS; `transition-[height]`
      won't work because `height: auto` isn't an animatable value.
    - `motion-safe:` wrapper skips the animation if the user prefers reduced motion.
    - `inert` blocks focus/clicks inside while collapsed (a11y); aria-hidden hides it
      from screen readers.
-->
<div
  class={['grid motion-safe:transition-[grid-template-rows]', open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]']}
  inert={!open}
  aria-hidden={!open}
>
  <div class="overflow-hidden">
    <!--
      Inner content:
        flex flex-col gap-2     stack rows vertically with 8px gap
        border-t                thin divider line between header and expanded area
        px-3 pt-2.5 pb-3        12px sides, 10px top, 12px bottom padding
    -->
    <div class="flex flex-col gap-2 border-t border-panel-border px-3 pt-2.5 pb-3">
      {#each voices as vol, i (i)}
        <div class={row}>
          <span class={label}>{VOICE_NAMES[i] ?? `♩ ${i + 1}`}</span>
          <input
            type="range"
            class={slider}
            min={0}
            max={100}
            value={vol}
            oninput={(e) => onVolumeChange(i, e.currentTarget.valueAsNumber)}
          />
          <span class={pct}>{vol} %</span>
        </div>
      {/each}
      <div class={row}>
        <span class={label}>Tempo</span>
        <input
          type="range"
          class={slider}
          min={speedMinPercentage}
          max={speedMaxPercentage}
          value={speedPercentage}
          oninput={(e) => onSpeedChange(e.currentTarget.valueAsNumber / 100)}
        />
        <span class={pct}>{speedPercentage} %</span>
      </div>
    </div>
  </div>
</div>
