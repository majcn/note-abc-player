<script lang="ts">
  import { ControlPanel } from '$lib/components/ControlPanel';
  import { MusicSheet } from '$lib/components/MusicSheet';
  import ErrorToast from '$lib/components/ErrorToast.svelte';

  let { data } = $props();

  let voices = $state<number[]>([]);
  let speed = $state(1);
  let bpm = $state(120);
  let isPlaying = $state(false);
  let error = $state<string | null>(null);
</script>

<MusicSheet
  abc={data.abc}
  {voices}
  {speed}
  {isPlaying}
  onLoad={(initial) => (voices = initial)}
  onBpmChange={(v) => (bpm = v)}
  onPlayingChange={(v) => (isPlaying = v)}
  onError={(msg) => (error = msg)}
/>

<div class="fixed top-4 right-4 z-[100] max-md:sticky max-md:inset-x-0 max-md:top-0">
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
