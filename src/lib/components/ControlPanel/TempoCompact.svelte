<script lang="ts">
  interface Props {
    playbackBpm: number;
    canDecrement?: boolean;
    canIncrement?: boolean;
    onSpeedStep: (direction: 'up' | 'down') => void;
  }

  let { playbackBpm, canDecrement = true, canIncrement = true, onSpeedStep }: Props = $props();
</script>

<div class="tempo-compact">
  <button
    type="button"
    class="tempo-bump"
    aria-label="Slow down"
    disabled={!canDecrement}
    onclick={() => onSpeedStep('down')}
  >
    −
  </button>
  <span class="tempo-value" aria-live="polite">{playbackBpm} BPM</span>
  <button
    type="button"
    class="tempo-bump"
    aria-label="Speed up"
    disabled={!canIncrement}
    onclick={() => onSpeedStep('up')}
  >
    +
  </button>
</div>

<style>
  .tempo-compact {
    display: flex;
    align-items: center;
    gap: 5px;
    flex-shrink: 0;
  }

  .tempo-bump {
    appearance: none;
    -webkit-appearance: none;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--color-control);
    border: 1px solid var(--color-control-border);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 15px;
    line-height: 1;
    color: rgba(255, 255, 255, 0.85);
    user-select: none;
    transition:
      background 0.15s,
      opacity 0.15s;
    flex-shrink: 0;
  }

  .tempo-bump:hover:not(:disabled) {
    background: var(--color-control-hover);
  }

  .tempo-bump:disabled {
    cursor: not-allowed;
    opacity: 0.4;
  }

  .tempo-value {
    color: var(--color-text);
    font-size: 12px;
    min-width: 56px;
    text-align: center;
  }

  @media (max-width: 768px) {
    .tempo-bump {
      width: 28px;
      height: 28px;
    }
  }
</style>
