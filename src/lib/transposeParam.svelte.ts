import { page } from '$app/state';
import { goto } from '$app/navigation';

export const TRANSPOSE_MAX = 12;

export function parseTranspose(param: string | null): number {
  const n = Math.trunc(Number(param));
  return Number.isFinite(n) ? Math.max(-TRANSPOSE_MAX, Math.min(TRANSPOSE_MAX, n)) : 0;
}

// `?t=` backed transpose state; writes use shallow goto (no load re-run).
export function transposeParam() {
  let value = $state(parseTranspose(page.url.searchParams.get('t')));
  return {
    get value() {
      return value;
    },
    set value(v: number) {
      value = v;
      // eslint-disable-next-line svelte/prefer-svelte-reactivity -- throwaway copy
      const url = new URL(page.url.href);
      if (v) url.searchParams.set('t', String(v));
      else url.searchParams.delete('t');
      goto(url, { shallow: true, replace: true, state: page.state });
    }
  };
}
