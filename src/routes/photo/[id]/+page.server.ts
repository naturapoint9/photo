import { error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { data: photo, error: photoErr } = await locals.supabase
		.from('photos')
		.select(`
			*,
			profiles!photos_user_id_fkey ( username )
		`)
		.eq('id', params.id)
		.single();

	if (photoErr || !photo) {
		console.error('photo load error:', photoErr?.message);
		throw error(404, 'photo not found');
	}

	// fetch tags separately to avoid nested join issues
	const { data: photoTags } = await locals.supabase
		.from('photo_tags')
		.select('tags ( id, name )')
		.eq('photo_id', params.id);

	photo.photo_tags = photoTags ?? [];

	const { data: comments } = await locals.supabase
		.from('comments')
		.select(`
			id,
			body,
			created_at,
			profiles!comments_user_id_fkey ( username )
		`)
		.eq('photo_id', params.id)
		.order('created_at', { ascending: true });

	const { data: favorites } = await locals.supabase
		.from('likes')
		.select('user_id, profiles!likes_user_id_fkey ( username )')
		.eq('photo_id', params.id);

	const { session } = await locals.safeGetSession();
	const userFavorited = session?.user
		? (favorites ?? []).some((l: any) => l.user_id === session.user!.id)
		: false;

	return {
		photo,
		comments: comments ?? [],
		favorites: favorites ?? [],
		favoriteCount: (favorites ?? []).length,
		userFavorited
	};
};

export const actions: Actions = {
	comment: async ({ request, locals, params }) => {
		const { session } = await locals.safeGetSession();
		if (!session?.user) return { error: 'must be logged in' };

		const formData = await request.formData();
		const body = formData.get('body') as string;
		if (!body?.trim()) return { error: 'comment cannot be empty' };

		const { error: err } = await locals.supabase.from('comments').insert({
			photo_id: params.id,
			user_id: session.user.id,
			body: body.trim()
		});

		if (err) return { error: err.message };
		return { success: true };
	},

	favorite: async ({ locals, params }) => {
		const { session } = await locals.safeGetSession();
		if (!session?.user) return { error: 'must be logged in' };

		const { data: existing } = await locals.supabase
			.from('likes')
			.select('user_id')
			.eq('photo_id', params.id)
			.eq('user_id', session.user.id)
			.single();

		if (existing) {
			await locals.supabase
				.from('likes')
				.delete()
				.eq('photo_id', params.id)
				.eq('user_id', session.user.id);
		} else {
			await locals.supabase.from('likes').insert({
				photo_id: params.id,
				user_id: session.user.id
			});
		}

		return { success: true };
	},

	edit: async ({ request, locals, params }) => {
		const { session } = await locals.safeGetSession();
		if (!session?.user) return { error: 'must be logged in' };

		const formData = await request.formData();
		const caption = (formData.get('caption') as string)?.trim() ?? '';
		const camera = (formData.get('camera') as string)?.trim() ?? '';
		const film_stock = (formData.get('film_stock') as string)?.trim() ?? '';
		const lens = (formData.get('lens') as string)?.trim() ?? '';
		const tagsRaw = (formData.get('tags') as string)?.trim() ?? '';

		const { error: updateErr } = await locals.supabase
			.from('photos')
			.update({ caption, camera, film_stock, lens })
			.eq('id', params.id)
			.eq('user_id', session.user.id);

		if (updateErr) return { error: updateErr.message };

		// rebuild tags: delete existing, re-insert
		await locals.supabase
			.from('photo_tags')
			.delete()
			.eq('photo_id', params.id);

		const tagNames = tagsRaw
			.split(',')
			.map((t) => t.trim().toLowerCase().replace(/^#/, ''))
			.filter((t) => t.length > 0);

		for (const name of tagNames) {
			const { data: existingTag } = await locals.supabase
				.from('tags')
				.select('id')
				.eq('name', name)
				.single();

			let tagId: number;
			if (existingTag) {
				tagId = existingTag.id;
			} else {
				const { data: newTag, error: tagErr } = await locals.supabase
					.from('tags')
					.insert({ name })
					.select('id')
					.single();
				if (tagErr) continue;
				tagId = newTag.id;
			}

			await locals.supabase.from('photo_tags').insert({
				photo_id: params.id,
				tag_id: tagId
			});
		}

		return { edited: true };
	},

	delete: async ({ locals, params }) => {
		const { session } = await locals.safeGetSession();
		if (!session?.user) return { error: 'must be logged in' };

		await locals.supabase
			.from('photos')
			.delete()
			.eq('id', params.id)
			.eq('user_id', session.user.id);

		return { deleted: true };
	}
};
