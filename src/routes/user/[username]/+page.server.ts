import { error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

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

	// fetch photos this user has favorited
	let favorites: any[] = [];
	const { data: likeRows } = await locals.supabase
		.from('likes')
		.select('photo_id')
		.eq('user_id', profile.id)
		.order('created_at', { ascending: false });

	const photoIds = (likeRows ?? []).map((r) => r.photo_id).filter(Boolean);
	if (photoIds.length > 0) {
		const { data: favPhotos } = await locals.supabase
			.from('photos')
			.select('id, image_url, caption, film_stock, created_at, profiles!photos_user_id_fkey ( username )')
			.in('id', photoIds);
		// preserve order by like date (photoIds order)
		const orderMap = new Map(photoIds.map((id, i) => [id, i]));
		favorites = ((favPhotos ?? []) as any[]).sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0));
	}

	// fetch shoutbox messages
	let shoutbox: any[] = [];
	const { data: shoutboxData, error: shoutErr } = await locals.supabase
		.from('shoutbox')
		.select('id, body, created_at, profiles!shoutbox_user_id_fkey ( username )')
		.eq('profile_id', profile.id)
		.order('created_at', { ascending: true });

	if (!shoutErr) {
		shoutbox = shoutboxData ?? [];
	}

	return {
		profile,
		photos: photos ?? [],
		photoCount: photoCount ?? 0,
		favorites,
		shoutbox
	};
};

export const actions: Actions = {
	shout: async ({ request, params, locals }) => {
		const { session } = await locals.safeGetSession();
		if (!session?.user) return { error: 'must be logged in' };

		const { data: profile } = await locals.supabase
			.from('profiles')
			.select('id')
			.eq('username', params.username)
			.single();

		if (!profile) return { error: 'user not found' };

		const formData = await request.formData();
		const body = (formData.get('body') as string)?.trim() ?? '';
		if (!body) return { error: 'message cannot be empty' };

		const { error: err } = await locals.supabase.from('shoutbox').insert({
			profile_id: profile.id,
			user_id: session.user.id,
			body
		});

		if (err) return { error: err.message };
		return { success: true };
	}
};
