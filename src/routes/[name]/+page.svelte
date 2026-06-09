<script lang="ts">
  import { ControlPanel } from '$lib/components/ControlPanel';
  import { MusicSheet } from '$lib/components/MusicSheet';
  import ErrorToast from '$lib/components/ErrorToast.svelte';
  import { untrack } from 'svelte';

  let { data } = $props();

  // Editable copy of the loaded score. MusicSheet debounces re-rendering, so we
  // can bind a textarea straight to this and it stays playable while editing.
  // untrack: seed from the initial load only; resyncOnNav handles later changes.
  let abcText = $state(untrack(() => data.abc));
  let loadedName = untrack(() => data.name);

  let voices = $state<number[]>([]);
  let speed = $state(1);
  let bpm = $state(120);
  let isPlaying = $state(false);
  let error = $state<string | null>(null);
  let editing = $state(false);

  // Reset the buffer when navigating to a different song (the component is
  // reused across routes, so $state would otherwise keep the old text).
  function resyncOnNav() {
    if (data.name !== loadedName) {
      loadedName = data.name;
      abcText = data.abc;
    }
  }
  $effect(resyncOnNav);
</script>

<MusicSheet
  abc={abcText}
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

<!-- Editor toggle -->
<button
  type="button"
  onclick={() => (editing = !editing)}
  class="fixed bottom-4 left-4 z-[100] rounded-md bg-neutral-800 px-3 py-1.5 text-sm text-white shadow-lg hover:bg-neutral-700"
>
  {editing ? 'Close editor' : 'Edit'}
</button>

<!-- ABC source editor: edits flow into abcText; MusicSheet re-renders (debounced). -->
{#if editing}
  <div class="fixed inset-x-0 bottom-0 z-[90] border-t border-neutral-300 bg-white p-3 shadow-2xl">
    <textarea
      bind:value={abcText}
      aria-label="ABC source"
      spellcheck="false"
      class="h-48 w-full resize-y rounded-md border border-neutral-300 p-2 font-mono text-sm focus:border-neutral-500 focus:outline-none"
    ></textarea>
  </div>
{/if}

<ErrorToast bind:error />
