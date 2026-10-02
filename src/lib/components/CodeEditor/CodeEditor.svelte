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
  import { lintGutter, setDiagnostics, type Diagnostic } from '@codemirror/lint';
  import { abc } from '$lib/codemirror/abc';

  // `value` is the initial document only (read once at mount); edits flow out via
  // onChange. No two-way binding — the editor owns its text after mount.
  // `errors` are engine messages shown as lint diagnostics (1-based line/col).
  type Props = {
    value?: string;
    class?: string;
    errors?: { line: number; col: number; message: string }[];
    onChange?: (value: string) => void;
    onCursor?: (offset: number) => void;
  };

  let { value = '', class: className = '', errors = [], onChange, onCursor }: Props = $props();

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
      // drawSelection() paints its own layer. CodeMirror's dark base theme
      // styles the focused selection with a high-specificity selector
      // (&dark.cm-focused > .cm-scroller > .cm-selectionLayer ...), so !important
      // is the reliable way to win for both focused and unfocused selections.
      '.cm-selectionLayer .cm-selectionBackground, ::selection': {
        backgroundColor: '#2f81f7 !important'
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
          lintGutter(),
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

  // Push engine errors into the editor. Positions refer to the text the sheet
  // last rendered (debounced), so clamp to the current doc; CodeMirror then maps
  // them through further edits. Each marks one char (the last one if the column
  // is past the line end).
  $effect(() => {
    if (!view) return;
    const doc = view.state.doc;
    const diagnostics: Diagnostic[] = errors.map((e) => {
      const line = doc.line(Math.max(1, Math.min(e.line, doc.lines)));
      const from = Math.max(line.from, Math.min(line.from + e.col - 1, line.to - 1));
      const to = Math.min(from + 1, line.to);
      return { from, to, severity: 'error', message: e.message };
    });
    view.dispatch(setDiagnostics(view.state, diagnostics));
  });

  // Select the note token at a source offset, scroll it into view, and focus the
  // editor. Called by the parent when a note in the rendered sheet is clicked —
  // selecting (not just placing a cursor) makes it obvious where the note landed.
  // The offset points at the note head; we expand left over leading accidentals
  // (^ _ =) and right over the note body (letter, octave marks, duration) while
  // stopping before the next note's accidental.
  const ACCIDENTAL = /[\^_=]/;
  const NOTE_BODY = /[A-Ga-gxzXZ,'0-9/]/;
  export function goToOffset(pos: number) {
    if (!view || !Number.isFinite(pos)) return;
    const doc = view.state.doc;
    const head = Math.max(0, Math.min(pos, doc.length));
    const at = (i: number) => doc.sliceString(i, i + 1);

    let from = head;
    while (from > 0 && ACCIDENTAL.test(at(from - 1))) from--;

    let to = head;
    // Always consume the head char, then continue over note-body chars.
    while (to < doc.length && (to === head || NOTE_BODY.test(at(to)))) to++;

    view.dispatch({ selection: { anchor: from, head: to }, scrollIntoView: true });
    view.focus();
  }

  // Chord = quoted string before a note ("Am"^c2); ^ _ < > @ prefixes are annotations.
  const ANNOTATION = /^[\^_<>@]/;
  function chordSpan(pos: number) {
    const doc = view!.state.doc;
    const at = (i: number) => doc.sliceString(i, i + 1);

    let from = Math.max(0, Math.min(pos, doc.length));
    while (from > 0 && ACCIDENTAL.test(at(from - 1))) from--;

    if (at(from - 1) === '"') {
      let open = from - 2;
      while (open >= 0 && at(open) !== '"' && at(open) !== '\n') open--;
      const text = doc.sliceString(open + 1, from - 1);
      if (at(open) === '"' && !ANNOTATION.test(text)) return { from: open, to: from, text };
    }
    return { from, to: from, text: '' };
  }

  export function chordAt(pos: number) {
    if (!view || !Number.isFinite(pos)) return '';
    return chordSpan(pos).text;
  }

  // Empty `chord` removes it.
  export function setChord(pos: number, chord: string) {
    if (!view || !Number.isFinite(pos)) return;
    const { from, to } = chordSpan(pos);
    const insert = chord ? `"${chord}"` : '';
    if (insert === view.state.doc.sliceString(from, to)) return;
    view.dispatch({ changes: { from, to, insert } });
  }
</script>

<div class={className} {@attach initEditor}></div>
