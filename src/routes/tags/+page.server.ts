import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { data: tags } = await locals.supabase
		.from('tags')
		.select('name')
		.order('name');

	return {
		tags: (tags ?? []).map((t: any) => t.name)
	};
};
