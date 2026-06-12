export interface Opt {
  curmsk: number;
  sf2url1: string;
  sf2url2: string;
  instTab: Record<string, unknown>;
  midijsUrl1: string;
  midijsUrl2: string;
  instList: Record<string, unknown>;
  transMap: Record<string, unknown>;
  burak: number;
  nosm: number;
  noDash: number;
  arpmaxdur: number;
}

export type Logerr = (msg: unknown) => void;
export type AddUnlockListener = (elm: HTMLElement, type: string, handler: EventListener) => void;

export declare const midiVol: number[];
export declare const midiPan: number[];
export declare const midiInstr: number[];
export declare const midiUsedArr: string[];
export declare const ntsSeq: unknown[];
export declare let iSeq: number;

export declare function setVolume(index: number, volume: number): void;
export declare function getVolumes(): number[];
export declare function setTempo(speed: number): void;
export declare function setOnTempo(fn: ((bpm: number) => void) | null): void;
export declare function setOnNoteClick(fn: ((offset: number) => void) | null): void;
export declare function addElms(): void;
export declare function setScale(): void;
export declare function putMarkLoc(note: unknown, align?: number): void;
export declare function markBySourceOffset(offset: number): void;
export declare function naarMaat(inc: number): void;
export declare function regelOmhoog(inc: number): void;
export declare function start_markeer(audioCtx: AudioContext | null, ntsel?: unknown): void;
export declare function stop_markeer(): void;
export declare function mapPerc(abc: string): [Record<string, number>, Record<string, unknown>];
export declare function perc2map(abc: string): string;
export declare function doModel(
  Abc: unknown,
  abctxt: string,
  opt: Opt,
  gTempo: number,
  debug: number,
  mapTab: Record<string, unknown>,
  logerr: Logerr,
  putMarkExt?: unknown
): void;
export declare function doLayout(
  Abc: unknown,
  abctxt: string,
  opt: Opt,
  abc_elm: null,
  fplay: number,
  abcElm: HTMLDivElement | null,
  logerr: Logerr,
  addUnlockListener: AddUnlockListener | (() => void),
  getPlaying: () => boolean,
  playBack: () => void,
  dolayout: (abctxt: string) => void
): void;
