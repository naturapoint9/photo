import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const tagName = params.name.toLowerCase();

	const { data: tag } = await locals.supabase
		.from('tags')
		.select('id, name')
		.eq('name', tagName)
		.single();

	if (!tag) {
		throw error(404, `tag "${tagName}" not found`);
	}

	const { data: photoTags } = await locals.supabase
		.from('photo_tags')
		.select(`
			photos (
				id,
				image_url,
				caption,
				film_stock,
				created_at,
				profiles!photos_user_id_fkey ( username )
			)
		`)
		.eq('tag_id', tag.id)
		.order('photo_id', { ascending: false });

	const photos = (photoTags ?? [])
		.map((pt: any) => pt.photos)
		.filter(Boolean)
		.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

	return {
		tag,
		photos
	};
};
