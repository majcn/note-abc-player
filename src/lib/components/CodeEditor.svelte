<script lang="ts">
  import { untrack } from 'svelte';
  import type { Attachment } from 'svelte/attachments';
  import { EditorState } from '@codemirror/state';
  import {
    EditorView,
    keymap,
    lineNumbers,
    highlightActiveLine,
    highlightActiveLineGutter,
    drawSelection
  } from '@codemirror/view';
  import { bracketMatching } from '@codemirror/language';
  import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
  import { abc } from '$lib/codemirror/abc';

  // `value` is the initial document only (read once at mount); edits flow out via
  // onChange. No two-way binding — the editor owns its text after mount.
  type Props = {
    value?: string;
    class?: string;
    onChange?: (value: string) => void;
    onCursor?: (offset: number) => void;
  };

  let { value = '', class: className = '', onChange, onCursor }: Props = $props();

  let view: EditorView | undefined;

  // Dark theme. Container styling lives here so callers only worry about size
  // via `class`. `dark: true` makes CodeMirror use its dark built-in defaults too.
  const theme = EditorView.theme(
    {
      '&': {
        height: '100%',
        fontSize: '0.875rem',
        color: '#c9d1d9',
        backgroundColor: '#0d1117'
      },
      '.cm-scroller': {
        overflow: 'auto',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
      },
      '&.cm-focused': { outline: 'none' },
      '.cm-content': { caretColor: '#c9d1d9' },
      '.cm-cursor, .cm-dropCursor': { borderLeftColor: '#c9d1d9' },
      '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': {
        backgroundColor: '#264f78'
      },
      '.cm-activeLine': { backgroundColor: '#161b2233' },
      '.cm-gutters': {
        backgroundColor: '#0d1117',
        color: '#6e7681',
        border: 'none'
      },
      '.cm-activeLineGutter': { backgroundColor: '#161b22', color: '#c9d1d9' },
      '.cm-matchingBracket, &.cm-focused .cm-matchingBracket': {
        backgroundColor: '#3fb95040',
        outline: '1px solid #3fb95080'
      }
    },
    { dark: true }
  );

  // Mount CodeMirror as an attachment. Attachments re-run when reactive state
  // they read changes, so the initial `value` read is untracked — otherwise every
  // keystroke (which updates `value`) would tear down and rebuild the whole
  // editor, dropping focus. The returned function tears the view down on unmount.
  const initEditor: Attachment<HTMLDivElement> = (node) => {
    view = new EditorView({
      parent: node,
      state: EditorState.create({
        doc: untrack(() => value),
        extensions: [
          lineNumbers(),
          highlightActiveLineGutter(),
          highlightActiveLine(),
          drawSelection(),
          history(),
          bracketMatching(),
          EditorView.lineWrapping,
          keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
          abc(),
          theme,
          // Report edits and cursor moves so the parent can re-render the sheet
          // and highlight the matching note.
          EditorView.updateListener.of((u) => {
            if (u.docChanged) onChange?.(u.state.doc.toString());
            if (u.selectionSet || u.docChanged) onCursor?.(u.state.selection.main.head);
          })
        ]
      })
    });

    return () => view?.destroy();
  };

  // Move the cursor to a source offset, scroll it into view, and focus the
  // editor. Called by the parent when a note in the rendered sheet is clicked.
  export function goToOffset(pos: number) {
    if (!view || !Number.isFinite(pos)) return;
    const anchor = Math.max(0, Math.min(pos, view.state.doc.length));
    view.dispatch({ selection: { anchor }, scrollIntoView: true });
    view.focus();
  }
</script>

<div class={className} {@attach initEditor}></div>
