<script lang="ts">
  interface Props {
    voices: number[];
    onVolumeChange: (i: number, v: number) => void;
  }

  let { voices, onVolumeChange }: Props = $props();

  const DEFAULT_VOLUME = 100;
  // Remembers the last non-zero volume per voice so unmuting restores it.
  // Not reactive — only read/written from event handlers.
  const previousVolumes: number[] = [];

  function handleToggle(i: number, vol: number) {
    if (vol === 0) {
      onVolumeChange(i, previousVolumes[i] ?? DEFAULT_VOLUME);
    } else {
      previousVolumes[i] = vol;
      onVolumeChange(i, 0);
    }
  }
</script>

<!-- flex-1 = stretch to fill the row; gap-1 = 4px between pills -->
<div class="flex flex-1 items-center gap-1">
  {#each voices as vol, i (i)}
    {@const muted = vol === 0}
    <!--
      Pill button per voice. Same look as bump buttons in TempoCompact.
        flex-1                       grow equally so the pills fill the row
        rounded-full                 pill shape
        border + bg + hover          control surface look
        px-[9px] py-[3px]            tight custom padding (Tailwind's px-2 py-1 would be too big)
        text-xs                      12px font
        whitespace-nowrap            keep "♩ 1" on one line so the pill can't grow into a circle
        select-none                  prevent dragging-to-select the "♩ 1" text
        focus-visible:outline-*      keyboard focus ring
      When muted:
        line-through                 strike through the label
        opacity-35                   fade to 35% to show "off" state
    -->
    <button
      type="button"
      class={[
        'flex-1 cursor-pointer rounded-full border border-panel-control-border bg-panel-control-bg px-[9px] py-[3px] text-xs whitespace-nowrap text-panel-text transition select-none hover:bg-panel-control-bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-panel-accent',
        muted && 'line-through opacity-35'
      ]}
      aria-label={`Voice ${i + 1}, ${muted ? 'muted' : 'audible'}`}
      aria-pressed={muted}
      onclick={() => handleToggle(i, vol)}
    >
      ♩ {i + 1}
    </button>
  {/each}
</div>
