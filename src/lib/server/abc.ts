import { dev } from '$app/environment';
import { error } from '@sveltejs/kit';

// Song names become filesystem paths (dev) and Dropbox paths (prod), so restrict
// to a safe charset to prevent path traversal (e.g. `../`, encoded slashes).
const VALID_NAME = /^[a-zA-Z0-9_-]+$/;

const ABC_ACCENTS: Record<string, Record<string, string>> = {
  '"':  { A:'Ä', E:'Ë', I:'Ï', O:'Ö', U:'Ü', a:'ä', e:'ë', i:'ï', o:'ö', u:'ü', y:'ÿ' },
  "'":  { A:'Á', E:'É', I:'Í', O:'Ó', U:'Ú', Y:'Ý', a:'á', e:'é', i:'í', o:'ó', u:'ú', y:'ý' },
  '`':  { A:'À', E:'È', I:'Ì', O:'Ò', U:'Ù', a:'à', e:'è', i:'ì', o:'ò', u:'ù' },
  '^':  { A:'Â', E:'Ê', I:'Î', O:'Ô', U:'Û', a:'â', e:'ê', i:'î', o:'ô', u:'û' },
  '~':  { A:'Ã', N:'Ñ', O:'Õ', a:'ã', n:'ñ', o:'õ' },
  ',':  { C:'Ç', c:'ç' },
};
const ABC_NAMED: Record<string, string> = {
  ss:'ß', ae:'æ', AE:'Æ', oe:'œ', OE:'Œ', aa:'å', AA:'Å', o:'ø', O:'Ø',
};

function decodeAbcText(text: string): string {
  return text
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/\\(ss|ae|AE|oe|OE|aa|AA|[oO])/g, (_, name) => ABC_NAMED[name] ?? _)
    .replace(/\\([`'"^~,])([A-Za-z])/g, (_, mark, ch) => ABC_ACCENTS[mark]?.[ch] ?? ch);
}

// Shared `load` for the song pages (/[name], /[name]/edit, /[name]/pdf), which
// all need exactly the same data: the song name and its ABC source.
export async function loadSongPage({
  params,
  platform
}: {
  params: { name: string };
  platform: Readonly<App.Platform> | undefined;
}): Promise<{ name: string; title: string; abc: string }> {
  const name = params.name;
  const abc = await loadAbc(name, platform?.env);
  const title = decodeAbcText(abc.match(/^T:(.+)$/m)?.[1]?.trim() ?? name);
  return { name, title, abc };
}

export async function loadAbc(name: string, env: App.Platform['env'] | undefined): Promise<string> {
  if (!VALID_NAME.test(name)) error(400, 'invalid song name');
  const abc = dev ? await readFromDummy(name) : await fetchFromDropbox(name, env!);
  // The file exists but isn't a real ABC tune (no `X:` reference number header).
  // Validated here so every caller (page load + /abc endpoint) stays consistent.
  if (!abc.includes('X:')) error(422, 'not a valid abc file');
  return abc;
}

async function readFromDummy(name: string): Promise<string> {
  const { readFile } = await import('node:fs/promises');
  const { resolve } = await import('node:path');
  const root = process.env.DEVELOPMENT_ABC_LOCATION ?? 'dummy';
  try {
    return await readFile(resolve(root, `${name}.abc`), 'utf-8');
  } catch {
    error(404, `${name}.abc not found in ${root}/`);
  }
}

// Cached Dropbox access token, kept in module scope. The deployed Worker is a V8
// isolate that handles many requests, and module-scope state lives for the
// isolate's lifetime — so this caches the token across requests and skips the
// OAuth round-trip on every page load. Best-effort only: it's per-isolate (each
// live isolate refreshes once) and lost on isolate eviction, never shared/durable.
// `env`/bindings only exist inside a request, so this must fill lazily (not at
// module init). Use KV if you ever need a guaranteed cross-isolate cache.
let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(env: App.Platform['env']): Promise<string> {
  // Reuse while still valid (we assume the response carries `expires_in`).
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.value;

  const tokenRes = await fetch('https://api.dropbox.com/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: env.DROPBOX_REFRESH_TOKEN,
      client_id: env.DROPBOX_ACCESS_KEY,
      client_secret: env.DROPBOX_SECRET_KEY
    })
  });
  if (!tokenRes.ok) error(502, 'Dropbox auth failed');
  const { access_token, expires_in } = (await tokenRes.json()) as {
    access_token: string;
    expires_in: number;
  };

  // Expire 60s early so we never hand out a token that dies mid-request.
  cachedToken = { value: access_token, expiresAt: Date.now() + (expires_in - 60) * 1000 };
  return access_token;
}

function downloadFile(name: string, accessToken: string): Promise<Response> {
  return fetch('https://content.dropboxapi.com/2/files/download', {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
      Authorization: `Bearer ${accessToken}`,
      'Dropbox-API-Arg': JSON.stringify({ path: `/${name}.abc` })
    }
  });
}

async function fetchFromDropbox(name: string, env: App.Platform['env']): Promise<string> {
  let fileRes = await downloadFile(name, await getAccessToken(env));

  // 401 means our cached token was revoked/expired before our estimated TTL.
  // Drop the cache and retry once with a freshly minted token.
  if (fileRes.status === 401) {
    cachedToken = null;
    fileRes = await downloadFile(name, await getAccessToken(env));
  }

  if (!fileRes.ok) error(fileRes.status, `${name}.abc not found on Dropbox`);
  return await fileRes.text();
}
