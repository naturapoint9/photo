import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { data: profile, error: profileErr } = await locals.supabase
		.from('profiles')
		.select('id, username, bio, avatar_url, link_youtube, link_instagram, link_tiktok, created_at')
		.eq('username', params.username)
		.single();

	if (profileErr || !profile) {
		throw error(404, 'user not found');
	}

	const { data: photos } = await locals.supabase
		.from('photos')
		.select('id, image_url, caption, film_stock, created_at')
		.eq('user_id', profile.id)
		.order('created_at', { ascending: false });

	const { count: photoCount } = await locals.supabase
		.from('photos')
		.select('*', { count: 'exact', head: true })
		.eq('user_id', profile.id);

	return {
		profile,
		photos: photos ?? [],
		photoCount: photoCount ?? 0
	};
};
