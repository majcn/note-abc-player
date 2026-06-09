// CodeMirror 6 language support for ABC music notation.
//
// ABC is line-oriented (header fields, a tune body, lyric lines, comments), so a
// StreamLanguage tokenizer is a much better fit than a full Lezer grammar. The
// token model is ported from the TextMate grammar in the "ABC Tools" VS Code
// extension (https://github.com/ishiharaf/abc, config/abc.tmGrammar.json), with
// a few refinements: header values and lyric runs get their own token so titles
// and words don't get mis-parsed as music, and notes/rests/durations are split
// out for richer highlighting.
//
// ABC standard reference: https://abcnotation.com/wiki/abc:standard:v2.1

import {
  HighlightStyle,
  LanguageSupport,
  StreamLanguage,
  syntaxHighlighting,
  type StreamParser
} from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

interface AbcState {
  // Set after a `w:`/`W:` field marker so the rest of that line reads as lyrics.
  inLyrics: boolean;
  // Set after any other field marker so the value reads as plain text, not music.
  inHeader: boolean;
}

// A field line begins with a single letter + ':' at the start of the line, e.g.
// `T:Title`, `K:G`, `w:la la`. Lyric fields (w/W) are handled separately.
const FIELD_LINE = /^[A-Za-z]:/;
// Inline field embedded in the tune body, e.g. `[K:G]` or `[M:3/4]`.
const INLINE_FIELD = /^\[[A-Za-z]:[^\]\n]*\]/;
// Bar lines and repeats: |  ||  |]  [|  |:  :|  ::
const BAR = /^(\|\]|\|\||::|:\||\|:|\[\||\|)/;
// Decorations: !trill!, !fermata!, and the legacy +...+ form.
const DECORATION = /^![^!\n]*!/;
const PLUS_DECORATION = /^\+[^+\n]*\+/;
// A pitch: optional accidentals, the note letter, then octave marks.
const NOTE = /^[_^=]*[A-Ga-g][,']*/;
const REST = /^[xzZ]/;
// Note length / tuplet figures: 2, 3/2, /, //, /4 ...
const NUMBER = /^(\d+(\/\d+)?|\/+\d*)/;

const parser: StreamParser<AbcState> = {
  name: 'abc',
  startState: () => ({ inLyrics: false, inHeader: false }),
  token(stream, state) {
    // --- Line classification (only at the very start of a line) ---
    if (stream.sol()) {
      state.inLyrics = false;
      state.inHeader = false;

      if (stream.match(/^%%/)) {
        stream.skipToEnd();
        return 'directive';
      }
      if (stream.match(/^%/)) {
        stream.skipToEnd();
        return 'comment';
      }

      const field = stream.match(FIELD_LINE) as RegExpMatchArray | null;
      if (field) {
        const letter = field[0][0];
        if (letter === 'w' || letter === 'W') state.inLyrics = true;
        else state.inHeader = true;
        return 'field';
      }
    }

    // --- Lyric line: all plain words. Quotes here are literal text (a syllable
    // wrapped like "DO"), not chord symbols, so the whole run is one lyric token.
    if (state.inLyrics) {
      stream.skipToEnd();
      return 'lyric';
    }

    // --- Header value: free text plus `key=value` attributes. Fields like
    // `V:1 clef=treble name="Soprano"` or `K:C clef=bass` carry attributes, so
    // keys / `=` / values are split out instead of dumped as one flat token. ---
    if (state.inHeader) {
      if (stream.eatSpace()) return null;
      if (stream.match(/^%.*/)) return 'comment';
      if (stream.match(/^"[^"\n]*"?/)) return 'chord'; // quoted value, e.g. name="…"
      if (stream.match(/^[A-Za-z][\w-]*(?=\s*=)/)) return 'attr'; // attribute key
      if (stream.match(/^=/)) return 'punct';
      if (stream.match(/^\d+(\/\d+)?/)) return 'number';
      if (!stream.match(/^[^\s="%]+/)) stream.next();
      return 'fieldValue';
    }

    // --- Tune body ---
    if (stream.eatSpace()) return null;

    // Trailing comment within a music line.
    if (stream.match(/^%.*/)) return 'comment';

    // Chord symbols / annotations: "Am", "^above". Tolerate an unterminated quote.
    if (stream.match(/^"[^"\n]*"?/)) return 'chord';
    if (stream.match(DECORATION) || stream.match(PLUS_DECORATION)) return 'decoration';

    if (stream.match(INLINE_FIELD)) return 'field';
    if (stream.match(BAR)) return 'bar';
    // Nth-ending bracket, e.g. `[1` / `[2`; the digit is tokenized next.
    if (stream.match(/^\[(?=\d)/)) return 'bar';

    const ch = stream.peek();
    if (ch === '[' || ch === ']') {
      stream.next();
      return 'bracket';
    }
    if (ch === '{' || ch === '}') {
      stream.next();
      return 'brace';
    }
    if (ch === '(' || ch === ')') {
      stream.next();
      return 'paren';
    }

    if (stream.match(NOTE)) return 'note';
    if (stream.match(REST)) return 'rest';
    if (stream.match(NUMBER)) return 'number';
    if (stream.match(/^[<>]/)) return 'operator'; // broken rhythm
    if (stream.match(/^-/)) return 'operator'; // tie

    stream.next();
    return null;
  },
  // Map our token names onto highlight tags so themes can style them.
  tokenTable: {
    field: t.keyword,
    fieldValue: t.attributeValue,
    attr: t.attributeName,
    punct: t.punctuation,
    directive: t.meta,
    comment: t.lineComment,
    chord: t.string,
    decoration: t.annotation,
    note: t.variableName,
    rest: t.literal,
    bar: t.controlOperator,
    number: t.number,
    bracket: t.squareBracket,
    brace: t.brace,
    paren: t.paren,
    operator: t.operator,
    lyric: t.content
  },
  languageData: {
    commentTokens: { line: '%' }
  }
};

const abcLanguage = StreamLanguage.define(parser);

// Dark theme tuned for the dark editor panel. Colors are roughly GitHub-dark.
const abcHighlightStyle = HighlightStyle.define([
  { tag: t.keyword, color: '#d2a8ff', fontWeight: '600' }, // field markers (X:, T:, K:)
  { tag: t.attributeValue, color: '#a5d6ff' }, // header values / titles
  { tag: t.attributeName, color: '#f0883e' }, // header attribute keys (clef=, name=)
  { tag: t.punctuation, color: '#8b949e' }, // header '=' separator
  { tag: t.meta, color: '#c586c0' }, // %% directives
  { tag: t.lineComment, color: '#8b949e', fontStyle: 'italic' }, // % comments
  { tag: t.string, color: '#7ee787' }, // chord symbols
  { tag: t.annotation, color: '#ffa657' }, // !decorations!
  { tag: t.variableName, color: '#79c0ff' }, // notes
  { tag: t.literal, color: '#e3b341' }, // rests
  { tag: t.controlOperator, color: '#ff7b72', fontWeight: '600' }, // bar lines
  { tag: t.number, color: '#56d4bc' }, // durations
  { tag: t.squareBracket, color: '#8b949e' },
  { tag: t.brace, color: '#d2a8ff' },
  { tag: t.paren, color: '#8b949e' },
  { tag: t.operator, color: '#ff7b72' },
  { tag: t.content, color: '#adbac7' } // lyrics
]);

/** CodeMirror language support for ABC notation, with syntax highlighting. */
export function abc(): LanguageSupport {
  return new LanguageSupport(abcLanguage, [syntaxHighlighting(abcHighlightStyle)]);
}
