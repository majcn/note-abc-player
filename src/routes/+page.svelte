<script lang="ts">
  import { ControlPanel } from '$lib/components/ControlPanel';
  import { MusicSheet } from '$lib/components/MusicSheet';
  import ErrorToast from '$lib/components/ErrorToast.svelte';

  const song = 'do-re-mi';

  let voices = $state<number[]>([]);
  let speed = $state(1);
  let bpm = $state(120);
  let isPlaying = $state(false);
  let error = $state<string | null>(null);
</script>

<MusicSheet
  {song}
  {voices}
  {speed}
  {isPlaying}
  onLoad={(initial) => (voices = initial)}
  onBpmChange={(v) => (bpm = v)}
  onPlayingChange={(v) => (isPlaying = v)}
  onError={(msg) => (error = msg)}
/>

<div class="panel-slot">
  <ControlPanel
    {voices}
    {isPlaying}
    {bpm}
    {speed}
    onVolumeChange={(i, v) => (voices[i] = v)}
    onSpeedChange={(v) => (speed = v)}
    onRequestPlay={(v) => (isPlaying = v)}
  />
</div>

<ErrorToast bind:error />

<style>
  .panel-slot {
    position: fixed;
    top: 16px;
    right: 16px;
    z-index: 100;
  }

  @media (max-width: 768px) {
    .panel-slot {
      position: sticky;
      top: 0;
      left: 0;
      right: 0;
    }
  }
</style>
