<script lang="ts">
  const VOICE_NAMES = ['Prvi glas', 'Drugi glas', 'Tretji glas', 'Četrti glas'];

  interface Props {
    voices: number[];
    speed: number;
    speedMin: number;
    speedMax: number;
    onVolumeChange: (i: number, val: number) => void;
    onSpeedChange: (v: number) => void;
  }

  let { voices, speed, speedMin, speedMax, onVolumeChange, onSpeedChange }: Props = $props();

  // Math.round needed: IEEE 754 float imprecision, e.g. 1.12 * 100 = 112.99999999999999
  let speedPercentage = $derived(Math.round(speed * 100));
  let speedMinPercentage = $derived(Math.round(speedMin * 100));
  let speedMaxPercentage = $derived(Math.round(speedMax * 100));
</script>

<div class="controls">
  <div class="voice-vols">
    {#each voices as vol, i (i)}
      <div class="voice-vol-ctrl">
        <span class="voice-vol-label">{VOICE_NAMES[i] ?? `♩ ${i + 1}`}</span>
        <input
          type="range"
          class="voice-vol"
          min={0}
          max={100}
          value={vol}
          oninput={(e) => onVolumeChange(i, e.currentTarget.valueAsNumber)}
        />
        <span class="voice-vol-pct">{vol} %</span>
      </div>
    {/each}
  </div>
  <div class="tempo-ctrl">
    <span class="voice-vol-label">Tempo</span>
    <input
      type="range"
      class="tempo"
      min={speedMinPercentage}
      max={speedMaxPercentage}
      value={speedPercentage}
      oninput={(e) => onSpeedChange(e.currentTarget.valueAsNumber / 100)}
    />
    <span class="voice-vol-pct tempo-bpm">{speedPercentage} %</span>
  </div>
</div>

<style>
  .controls {
    background: var(--color-surface);
    backdrop-filter: var(--surface-blur);
    -webkit-backdrop-filter: var(--surface-blur);
    border-radius: 0 0 var(--surface-radius) var(--surface-radius);
    border: 1px solid var(--color-surface-border);
    border-top: none;
    padding: 10px 12px 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    box-shadow: var(--surface-shadow);
  }

  .voice-vols {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .voice-vol-ctrl,
  .tempo-ctrl {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .voice-vol-label {
    color: var(--color-text-secondary);
    font-size: 12px;
    white-space: nowrap;
    min-width: 76px;
  }

  .voice-vol,
  .tempo {
    flex: 1;
    accent-color: var(--color-accent);
    cursor: pointer;
  }

  .voice-vol-pct {
    color: var(--color-text-tertiary);
    font-size: 12px;
    width: 54px;
    flex-shrink: 0;
    text-align: right;
  }

  @media (max-width: 768px) {
    .controls {
      border-radius: 0;
    }
  }
</style>
