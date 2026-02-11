import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { session, user } = await locals.safeGetSession();
	if (!session || !user) redirect(303, '/login');

	// fetch most recent photo for pre-filling gear
	const { data: lastPhoto } = await locals.supabase
		.from('photos')
		.select('camera, film_stock, lens, format')
		.eq('user_id', user.id)
		.order('created_at', { ascending: false })
		.limit(1)
		.single();

	// fetch all distinct values for autocomplete
	const { data: allPhotos } = await locals.supabase
		.from('photos')
		.select('camera, film_stock, lens');

	const cameras = [...new Set((allPhotos ?? []).map((p: any) => p.camera).filter(Boolean))].sort();
	const films = [...new Set((allPhotos ?? []).map((p: any) => p.film_stock).filter(Boolean))].sort();
	const lenses = [...new Set((allPhotos ?? []).map((p: any) => p.lens).filter(Boolean))].sort();

	return {
		lastCamera: lastPhoto?.camera ?? '',
		lastFilm: lastPhoto?.film_stock ?? '',
		lastLens: lastPhoto?.lens ?? '',
		lastFormat: lastPhoto?.format ?? '',
		cameras,
		films,
		lenses
	};
};
