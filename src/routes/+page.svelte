<script lang="ts">
  import { ControlPanel } from '$lib/components/ControlPanel';

  let voices = $state([100, 80, 60, 40]);
  let speed = $state(1);
  let isPlaying = $state(false);
  const bpm = 120;
</script>

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

<main>
  <h1>note-abc-player</h1>
  <p>Score / sheet renders here.</p>
</main>

<style>
  .panel-slot {
    position: fixed;
    top: 16px;
    right: 16px;
    z-index: 100;
  }

  main {
    padding: 24px;
    max-width: 960px;
    margin: 0 auto;
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
