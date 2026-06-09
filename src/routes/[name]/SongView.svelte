<script lang="ts">
  import { tick } from 'svelte';
  import { ControlPanel } from '$lib/components/ControlPanel';
  import { MusicSheet } from '$lib/components/MusicSheet';
  import ErrorToast from '$lib/components/ErrorToast.svelte';
  import CodeEditor from '$lib/components/CodeEditor.svelte';

  type Props = { abc: string };

  let { abc }: Props = $props();

  // Set by bind:this; structural types — we only call these exported methods.
  let editor = $state<{ goToOffset: (pos: number) => void }>();
  let sheet = $state<{ highlightSource: (offset: number) => void }>();
  let toast = $state<{ show: (msg: unknown) => void }>();

  // Clicking a note in the sheet opens the editor (if closed) and jumps the
  // cursor to that note's source offset. tick() waits for the editor to mount
  // when it was closed, so bind:this is set before we call into it.
  async function jumpToNote(offset: number) {
    editing = true;
    await tick();
    editor?.goToOffset(offset);
  }

  // Editable copy of the loaded score, seeded once from the `abc` prop. The page
  // wraps this component in {#key song name}, so navigating to a different song
  // recreates the component and re-seeds this buffer — no reset effect needed.
  // CodeEditor takes this as its initial value and reports edits via onChange;
  // MusicSheet debounces re-rendering so it stays playable while editing.
  // Seeding from a prop is intentional (the {#key} above re-seeds on nav).
  // svelte-ignore state_referenced_locally
  let abcText = $state(abc);

  let voices = $state<number[]>([]);
  let speed = $state(1);
  let bpm = $state(120);
  let isPlaying = $state(false);
  let editing = $state(false);
</script>

<MusicSheet
  bind:this={sheet}
  abc={abcText}
  {voices}
  {speed}
  {isPlaying}
  onLoad={(initial) => (voices = initial)}
  onBpmChange={(v) => (bpm = v)}
  onPlayingChange={(v) => (isPlaying = v)}
  onError={(msg) => toast?.show(msg)}
  onNoteClick={jumpToNote}
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
    <CodeEditor
      bind:this={editor}
      value={abcText}
      onChange={(v) => (abcText = v)}
      onCursor={(offset) => sheet?.highlightSource(offset)}
      class="h-64 w-full"
    />
  </div>
{/if}

<ErrorToast bind:this={toast} />
