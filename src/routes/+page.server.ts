import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

const VALID_NAME = /^[a-zA-Z0-9_-]+$/;

export const load: PageServerLoad = ({ url }) => {
  const song = url.searchParams.get('song');
  if (song) {
    if (!VALID_NAME.test(song)) error(400, 'invalid song name');
    redirect(301, `/${song}`);
  }
};
