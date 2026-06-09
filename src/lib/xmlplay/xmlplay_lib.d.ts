// Type shim for our forked xmlplay JS. Skips type-checking this directory.
// xmlplay_lib.js is hand-maintained; after running scripts/update-xmlplay.sh,
// diff src/lib/vendor/xmlplay/ against this folder and port changes manually.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const lib: Record<string, any>;
export = lib;
