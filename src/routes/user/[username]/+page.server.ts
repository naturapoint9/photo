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
	const { data: favRows } = await locals.supabase
		.from('likes')
		.select('photo_id, photos ( id, image_url, caption, film_stock, created_at, profiles!photos_user_id_fkey ( username ) )')
		.eq('user_id', profile.id)
		.order('created_at', { ascending: false });

	const favorites = (favRows ?? []).map((r: any) => r.photos).filter(Boolean);

	const { data: shoutbox } = await locals.supabase
		.from('shoutbox')
		.select(`
			id,
			body,
			created_at,
			profiles!shoutbox_user_id_fkey ( username )
		`)
		.eq('profile_id', profile.id)
		.order('created_at', { ascending: true });

	return {
		profile,
		photos: photos ?? [],
		photoCount: photoCount ?? 0,
		favorites,
		shoutbox: shoutbox ?? []
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
