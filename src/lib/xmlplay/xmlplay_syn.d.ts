import type { Opt, Logerr } from './xmlplay_lib';

export declare function setSynVars(
  audioCtx: AudioContext | null,
  opt: Opt,
  midiVol: number[],
  midiPan: number[],
  midiInstr: number[],
  midiUsedArr: string[],
  withRT: boolean,
  hasPan: boolean,
  hasLFO: boolean,
  hasFlt: boolean,
  hasVCF: boolean,
  instMap: number[],
  logerr: Logerr
): void;

export declare function laadNoot(playback?: unknown): Promise<void>;
