import { loadAbc } from '$lib/server/abc';
import type { RequestHandler } from './$types';

const HEADERS = {
  'Cache-Control': 'public, max-age=86400',
  'Content-Type': 'text/plain; charset=utf-8'
};

export const GET: RequestHandler = async ({ params, platform }) => {
  const body = await loadAbc(params.name!, platform?.env);
  return new Response(body, { headers: HEADERS });
};
