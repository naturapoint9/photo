import { createBrowserClient, createServerClient, isBrowser } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ data, depends, fetch }) => {
	depends('supabase:auth');

	try {
		const supabase = isBrowser()
			? createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
					global: { fetch }
				})
			: createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
					global: { fetch },
					cookies: { getAll: () => [] }
				});

		const {
			data: { session }
		} = await supabase.auth.getSession();

		return { ...data, supabase, session };
	} catch (err) {
		console.error('Layout load error:', err);
		return { ...data, supabase: null, session: null };
	}
};
