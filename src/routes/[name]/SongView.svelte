<script lang="ts">
  import { ControlPanel } from '$lib/components/ControlPanel';
  import { MusicSheet } from '$lib/components/MusicSheet';
  import ErrorToast from '$lib/components/ErrorToast.svelte';
  import CodeEditor from '$lib/components/CodeEditor.svelte';

  let { abc }: { abc: string } = $props();

  // Editable copy of the loaded score, seeded once from the `abc` prop. The page
  // wraps this component in {#key song name}, so navigating to a different song
  // recreates the component and re-seeds this buffer — no reset effect needed.
  // CodeEditor binds straight to it (plain $state -> real two-way binding), and
  // MusicSheet debounces re-rendering so it stays playable while editing.
  // Seeding from a prop is intentional (the {#key} above re-seeds on nav).
  // svelte-ignore state_referenced_locally
  let abcText = $state(abc);

  let voices = $state<number[]>([]);
  let speed = $state(1);
  let bpm = $state(120);
  let isPlaying = $state(false);
  let error = $state<string | null>(null);
  let editing = $state(false);
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
  <div class="fixed inset-x-0 bottom-0 z-[90] border-t border-neutral-700 bg-[#0d1117] shadow-2xl">
    <CodeEditor bind:value={abcText} class="h-64 w-full" />
  </div>
{/if}

<ErrorToast bind:error />
