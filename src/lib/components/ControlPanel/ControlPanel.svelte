<script lang="ts">
  import PlayButton from './PlayButton.svelte';
  import VoiceButtons from './VoiceButtons.svelte';
  import TempoCompact from './TempoCompact.svelte';
  import ExpandedPanel from './ExpandedPanel.svelte';

  interface Props {
    voices: number[];
    isPlaying: boolean;
    bpm: number;
    speed: number;
    speedMin?: number;
    speedMax?: number;
    speedStep?: number;
    onVolumeChange: (i: number, v: number) => void;
    onSpeedChange: (v: number) => void;
    onRequestPlay: (isPlaying: boolean) => void;
  }

  let {
    voices,
    isPlaying,
    bpm,
    speed,
    speedMin = 0.1,
    speedMax = 3,
    speedStep = 0.1,
    onVolumeChange,
    onSpeedChange,
    onRequestPlay
  }: Props = $props();

  let open = $state(false);
  let playbackBpm = $derived(Math.round(bpm * speed));

  function clampSpeed(v: number) {
    // Math.round needed: IEEE 754 float imprecision, e.g. 1.12 * 100 = 112.99999999999999
    return Math.min(speedMax, Math.max(speedMin, Math.round(v * 100) / 100));
  }

  function handleSpeedStep(direction: 'up' | 'down') {
    const delta = direction === 'up' ? speedStep : -speedStep;
    onSpeedChange(clampSpeed(speed + delta));
  }
</script>

<div class="btns">
  <div class={['mbar', { open }]}>
    <PlayButton {isPlaying} {onRequestPlay} />
    <VoiceButtons {voices} {onVolumeChange} />
    <TempoCompact
      {playbackBpm}
      canDecrement={speed > speedMin}
      canIncrement={speed < speedMax}
      onSpeedStep={handleSpeedStep}
    />
    <button
      type="button"
      class={['toggle-btn', { open }]}
      aria-label={open ? 'Collapse' : 'Expand'}
      aria-expanded={open}
      onclick={() => (open = !open)}
    ></button>
  </div>
  {#if open}
    <ExpandedPanel {voices} {speed} {speedMin} {speedMax} {onSpeedChange} {onVolumeChange} />
  {/if}
</div>

<style>
  .btns {
    display: inline-flex;
    flex-direction: column;
  }

  .mbar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: var(--color-surface);
    backdrop-filter: var(--surface-blur);
    -webkit-backdrop-filter: var(--surface-blur);
    border-radius: var(--surface-radius);
    border: 1px solid var(--color-surface-border);
    box-shadow: var(--surface-shadow);
    color: var(--color-text);
    font-size: 13px;
    transition:
      border-radius 0.15s,
      border-bottom-color 0.15s,
      box-shadow 0.15s;
    cursor: default;
  }

  .mbar.open {
    border-radius: var(--surface-radius) var(--surface-radius) 0 0;
    border-bottom-color: rgba(255, 255, 255, 0.06);
    box-shadow: none;
  }

  .toggle-btn {
    appearance: none;
    -webkit-appearance: none;
    border: none;
    padding: 0;
    margin-left: auto;
    width: 22px;
    height: 22px;
    flex-shrink: 0;
    cursor: pointer;
    background-color: var(--color-icon);
    mask-image: url('@material-design-icons/svg/filled/expand_more.svg');
    -webkit-mask-image: url('@material-design-icons/svg/filled/expand_more.svg');
    mask-repeat: no-repeat;
    -webkit-mask-repeat: no-repeat;
    mask-position: center;
    -webkit-mask-position: center;
    mask-size: 22px;
    -webkit-mask-size: 22px;
    transition:
      background-color 0.15s,
      transform 0.2s;
  }

  .toggle-btn:hover {
    background-color: var(--color-icon-hover);
  }

  .toggle-btn.open {
    transform: rotate(180deg);
  }

  @media (max-width: 768px) {
    .btns {
      display: block;
      width: 100%;
    }

    .mbar {
      border-radius: 0;
      flex-wrap: wrap;
      gap: 6px;
    }

    .mbar.open {
      border-radius: 0;
    }

    .toggle-btn {
      width: 44px;
      height: 44px;
      mask-size: 26px;
      -webkit-mask-size: 26px;
    }
  }
</style>
