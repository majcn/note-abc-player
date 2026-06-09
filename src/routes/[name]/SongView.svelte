<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { ControlPanel } from '$lib/components/ControlPanel';
  import { MusicSheet } from '$lib/components/MusicSheet';
  import ErrorToast from '$lib/components/ErrorToast.svelte';
  import CodeEditor from '$lib/components/CodeEditor.svelte';

  // `editable` gates all editing UI/behavior: the editor pane, resize handle,
  // toggle button, and sheet note-click → editor jump. The read-only route
  // (/[name]) leaves it false; the edit route (/[name]/edit) sets it true.
  type Props = { abc: string; editable?: boolean };

  let { abc, editable = false }: Props = $props();

  // Set by bind:this; structural types — we only call these exported methods.
  let editor = $state<{ goToOffset: (pos: number) => void }>();
  let sheet = $state<{ highlightSource: (offset: number) => void }>();
  let toast = $state<{ show: (msg: unknown) => void }>();

  // Clicking a note in the sheet opens the editor (if closed) and jumps the
  // cursor to that note's source offset. tick() waits for the editor to mount
  // when it was closed, so bind:this is set before we call into it.
  async function jumpToNote(offset: number) {
    if (!editing) {
      editing = true;
      await tick();
      relayoutSheet();
    }
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
  // svelte-ignore state_referenced_locally
  let editing = $state(editable);

  // Width of the left editor pane, in px. Dragging the divider updates it; the
  // sheet pane takes the remaining width. Persisted across reloads.
  const WIDTH_KEY = 'abc-editor-width';
  const MIN_PANE = 240;
  let editorWidth = $state(480);

  onMount(() => {
    const saved = Number(localStorage.getItem(WIDTH_KEY));
    if (saved) editorWidth = clampWidth(saved);
  });

  function clampWidth(w: number) {
    return Math.max(MIN_PANE, Math.min(w, window.innerWidth - MIN_PANE));
  }

  // The sheet engine re-lays the score out on window resize, so after the pane
  // width changes we fake a resize event rather than reaching into MusicSheet.
  function relayoutSheet() {
    window.dispatchEvent(new Event('resize'));
  }

  // The engine appends a fixed, full-viewport-width scroll line (#rollijn) to
  // <body>; expose the sheet pane's left edge as a CSS var so app.css can clamp
  // that line to the right pane instead of letting it run across the editor.
  // (Effects run client-side only, so touching the DOM here is safe.)
  const DIVIDER_PX = 6; // matches the w-1.5 resize handle
  $effect(() => {
    const left = editing ? editorWidth + DIVIDER_PX : 0;
    document.documentElement.style.setProperty('--sheet-left', `${left}px`);
  });

  // Drag the divider. Track on the window so the cursor can leave the thin
  // handle mid-drag without dropping it.
  function startResize(e: PointerEvent) {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = editorWidth;

    const onMove = (ev: PointerEvent) => {
      editorWidth = clampWidth(startWidth + (ev.clientX - startX));
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      document.body.style.removeProperty('cursor');
      document.body.style.removeProperty('user-select');
      localStorage.setItem(WIDTH_KEY, String(editorWidth));
      relayoutSheet();
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }

  async function toggleEditor() {
    editing = !editing;
    await tick();
    relayoutSheet();
  }
</script>

<div class="flex h-dvh w-full overflow-hidden">
  <!-- Left: ABC source editor. Edits flow into abcText; MusicSheet re-renders (debounced). -->
  {#if editable && editing}
    <div
      class="shrink-0 overflow-hidden border-r border-neutral-700 bg-[#0d1117]"
      style="width: {editorWidth}px"
    >
      <CodeEditor
        bind:this={editor}
        value={abcText}
        onChange={(v) => (abcText = v)}
        onCursor={(offset) => sheet?.highlightSource(offset)}
        class="h-full w-full"
      />
    </div>

    <!-- Resize handle -->
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize editor"
      tabindex="-1"
      onpointerdown={startResize}
      class="w-1.5 shrink-0 cursor-col-resize bg-neutral-700 transition-colors hover:bg-neutral-500"
    ></div>
  {/if}

  <!-- Right: rendered music sheet. -->
  <div class="relative min-w-0 flex-1 overflow-hidden">
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
      onNoteClick={editable ? jumpToNote : undefined}
    />
  </div>
</div>

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

<!-- Editor toggle (edit route only) -->
{#if editable}
  <button
    type="button"
    onclick={toggleEditor}
    class="fixed bottom-4 left-4 z-[100] rounded-md bg-neutral-800 px-3 py-1.5 text-sm text-white shadow-lg hover:bg-neutral-700"
  >
    {editing ? 'Close editor' : 'Edit'}
  </button>
{/if}

<ErrorToast bind:this={toast} />
