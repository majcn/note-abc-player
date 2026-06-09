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

<div class="voices">
  {#each voices as vol, i (i)}
    {@const muted = vol === 0}
    <button
      type="button"
      class={['voice-button', { muted }]}
      aria-label={`Voice ${i + 1}, ${muted ? 'muted' : 'audible'}`}
      aria-pressed={muted}
      onclick={() => handleToggle(i, vol)}
    >
      ♩ {i + 1}
    </button>
  {/each}
</div>

<style>
  .voices {
    display: flex;
    gap: 4px;
    align-items: center;
  }

  .voice-button {
    appearance: none;
    -webkit-appearance: none;
    padding: 3px 9px;
    border-radius: 20px;
    background: var(--color-control);
    color: var(--color-text);
    font-size: 12px;
    cursor: pointer;
    user-select: none;
    border: 1px solid var(--color-control-border);
    transition:
      background 0.15s,
      opacity 0.15s;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .voice-button:hover {
    background: var(--color-control-hover);
  }

  .voice-button.muted {
    opacity: 0.35;
    text-decoration: line-through;
  }
</style>
