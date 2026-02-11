import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	const { session, user } = await locals.safeGetSession();

	// canonical URL for og:url (pages can override with full URL)
	const canonicalUrl = url.origin + url.pathname + url.search;

	let profile = null;
	if (user) {
		const { data } = await locals.supabase
			.from('profiles')
			.select('username, bio, avatar_url')
			.eq('id', user.id)
			.single();
		profile = data;
	}

	return { session, user, profile, canonicalUrl };
};
