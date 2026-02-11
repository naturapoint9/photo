import { redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { session, user } = await locals.safeGetSession();
	if (!session || !user) redirect(303, '/login');

	const { data: profile } = await locals.supabase
		.from('profiles')
		.select('username, bio, avatar_url, link_youtube, link_instagram, link_tiktok')
		.eq('id', user.id)
		.single();

	return { profile };
};

export const actions: Actions = {
	profile: async ({ request, locals }) => {
		const { session, user } = await locals.safeGetSession();
		if (!session || !user) redirect(303, '/login');

		const formData = await request.formData();
		const username = (formData.get('username') as string)?.trim();
		const bio = (formData.get('bio') as string)?.trim() ?? '';
		const link_youtube = (formData.get('link_youtube') as string)?.trim() ?? '';
		const link_instagram = (formData.get('link_instagram') as string)?.trim() ?? '';
		const link_tiktok = (formData.get('link_tiktok') as string)?.trim() ?? '';

		if (!username || username.length < 2) {
			return { error: 'username must be at least 2 characters' };
		}

		if (!/^[a-z0-9_]+$/.test(username)) {
			return { error: 'username: lowercase letters, numbers, underscores only' };
		}

		const { error: err } = await locals.supabase
			.from('profiles')
			.update({ username, bio, link_youtube, link_instagram, link_tiktok })
			.eq('id', user.id);

		if (err) {
			if (err.message.includes('duplicate') || err.message.includes('unique')) {
				return { error: 'that username is already taken' };
			}
			return { error: err.message };
		}

		return { success: true };
	},

	avatar: async ({ request, locals }) => {
		const { session, user } = await locals.safeGetSession();
		if (!session || !user) redirect(303, '/login');

		const formData = await request.formData();
		const file = formData.get('avatar') as File;

		if (!file || file.size === 0) {
			return { avatarError: 'please select an image' };
		}

		if (!file.type.startsWith('image/')) {
			return { avatarError: 'file must be an image' };
		}

		if (file.size > 2 * 1024 * 1024) {
			return { avatarError: 'image must be under 2 MB' };
		}

		const ext = file.name.split('.').pop() || 'jpg';
		const filePath = `${user.id}/avatar.${ext}`;

		const { error: uploadErr } = await locals.supabase.storage
			.from('avatars')
			.upload(filePath, file, { upsert: true });

		if (uploadErr) {
			return { avatarError: uploadErr.message };
		}

		const { data: urlData } = locals.supabase.storage
			.from('avatars')
			.getPublicUrl(filePath);

		// append cache-buster so browsers pick up the new image
		const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

		const { error: updateErr } = await locals.supabase
			.from('profiles')
			.update({ avatar_url: avatarUrl })
			.eq('id', user.id);

		if (updateErr) {
			return { avatarError: updateErr.message };
		}

		return { avatarSuccess: true };
	}
};
