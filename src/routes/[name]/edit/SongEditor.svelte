<script lang="ts">
  import { onMount, tick } from 'svelte';
  import SongPlayer from '$lib/components/SongPlayer.svelte';
  // CodeEditor (and CodeMirror) is imported statically: this component is only
  // reached via the edit route, so route-level code-splitting already keeps it
  // out of the read-only route's bundle. No dynamic import needed.
  import { CodeEditor } from '$lib/components/CodeEditor';

  let { abc }: { abc: string } = $props();

  // Set by bind:this; structural types — we only call these exported methods.
  let editor = $state<{ goToOffset: (pos: number) => void }>();
  let player = $state<{ highlightSource: (offset: number) => void }>();

  // Editable copy of the loaded score, seeded once from the `abc` prop. The page
  // wraps this component in {#key song name}, so navigating to a different song
  // recreates the component and re-seeds this buffer — no reset effect needed.
  // CodeEditor takes this as its initial value and reports edits via onChange;
  // MusicSheet debounces re-rendering so it stays playable while editing.
  // svelte-ignore state_referenced_locally
  let abcText = $state(abc);

  let editing = $state(true);

  // Width of the left editor pane, in px. Dragging the divider updates it; the
  // sheet pane takes the remaining width. Persisted across reloads.
  const WIDTH_KEY = 'abc-editor-width';
  const MIN_PANE = 240;
  let editorWidth = $state(480);

  onMount(() => {
    const saved = Number(localStorage.getItem(WIDTH_KEY));
    if (saved) editorWidth = clampWidth(saved);
  });

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
  {#if editing}
    <div class="shrink-0 overflow-hidden border-r border-neutral-700 bg-[#0d1117]" style="width: {editorWidth}px">
      <CodeEditor
        bind:this={editor}
        value={abcText}
        onChange={(v) => (abcText = v)}
        onCursor={(offset) => player?.highlightSource(offset)}
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

  <SongPlayer bind:this={player} abc={abcText} onNoteClick={jumpToNote} />
</div>

<!-- Editor toggle -->
<button
  type="button"
  onclick={toggleEditor}
  class="fixed bottom-4 left-4 z-100 rounded-md bg-neutral-800 px-3 py-1.5 text-sm text-white shadow-lg hover:bg-neutral-700"
>
  {editing ? 'Close editor' : 'Edit'}
</button>
