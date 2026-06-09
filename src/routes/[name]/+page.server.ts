import { loadAbc } from '$lib/server/abc';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, platform }) => {
  const name = params.name;
  const abc = await loadAbc(name, platform?.env);
  return { name, abc };
};
