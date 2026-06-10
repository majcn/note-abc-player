// Shared abc2svg engine plumbing for MusicSheet (interactive) and PrintSheet
// (static print view), so the loader, glyph defs and source preprocessing have
// a single source of truth.
import * as mLib from '$lib/xmlplay/xmlplay_lib.js';

// Minimal shape we touch on the vendor module.
export type Abc2Svg = {
  Abc: unknown;
  mhooks: Record<string, unknown>;
};

// abc2svg is ~290 kB — dynamic import puts it in its own hashed chunk
// (long-cache via _app/immutable/), loaded on first song. Cached at module
// scope so both components (and repeated mounts) share one instance.
let cached: Abc2Svg | null = null;
// Original strtab hook, saved before preprocessAbc starts toggling it.
let tabHaak: unknown = null;

export async function loadAbc2svg(): Promise<Abc2Svg> {
  if (!cached) {
    const mod = await import('$lib/vendor/abc2svg/abc2svg-bundle.js');
    cached = mod.default as Abc2Svg;
    tabHaak = cached.mhooks['strtab'];
  }
  return cached;
}

// Equal-temperament accidental glyphs (1/3-tone arrows), prepended to tunes
// that use %%temperamentequal.
export const svg36 = [
  '%%beginsvg',
  '<defs>',
  '<text id="acc1_3" x="-1">&#xe261; <tspan x="-6" y="-4" style="font-size:14px">&#8593;</tspan></text>',
  '<text id="acc2_3" x="-1">&#xe262; <tspan x="-5" y="14" style="font-size:14px">&#8595;</tspan></text>',
  '<text id="acc4_3" x="-1">&#xe262; <tspan x="-5" y="-4" style="font-size:14px">&#8593;</tspan></text>',
  '<text id="acc-4_3" x="-2">&#xe260; <tspan x="-8.2" y="9" style="font-size:16px">&#8595;</tspan></text>',
  '<text id="acc-2_3" x="-1">&#xe260; <tspan x="-7.3" y="-1" style="font-size:16px">&#8593;</tspan></text>',
  '<text id="acc-1_3" x="-1">&#xe261; <tspan x="-2" y="12" style="font-size:14px">&#8595;</tspan></text>',
  '</defs>',
  '%%endsvg'
].join('\n');

// Vendor logs many non-error progress messages through logerr — suppress those.
export function createLogerr(onError: ((message: string) => void) | undefined) {
  return (s: unknown) => {
    const str = String(s);
    if (
      str === 'no error' ||
      str === 'fonts geladen' ||
      str === 'notes decoded' ||
      str.includes('loading instrument')
    ) {
      return;
    }
    onError?.(str);
  };
}

// Source preprocessing shared by both layout paths: toggle the string-tab hook
// for tab+voicemap tunes, expand I:percmap, and inject the equal-temperament
// glyph defs. Returns the text to hand to the engine.
export function preprocessAbc(abc2svg: Abc2Svg, abctxt: string): string {
  if (/V:\w+\s*tab.*voicemap/s.test(abctxt)) {
    delete abc2svg.mhooks['strtab'];
  } else if (tabHaak) {
    abc2svg.mhooks['strtab'] = tabHaak;
  }
  if (abctxt.includes('I:percmap')) abctxt = mLib.perc2map(abctxt);
  if (abctxt.includes('temperamentequal')) abctxt = svg36 + '\n' + abctxt;
  return abctxt;
}
