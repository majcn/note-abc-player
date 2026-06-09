// Type shim for vendor JS. Sits next to xmlplay_lib.js so TypeScript skips
// type-checking the pristine vendor file. Do not edit the .js itself — it is
// overwritten by scripts/update-xmlplay.sh.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const lib: Record<string, any>;
export = lib;
