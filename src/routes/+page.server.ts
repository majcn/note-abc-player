import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ url }) => {
  const song = url.searchParams.get('song');
  if (song) {
    redirect(301, `/${song}`);
  }
};
