import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals }) => {
	const camera = url.searchParams.get('camera') || '';
	const film = url.searchParams.get('film') || '';
	const lens = url.searchParams.get('lens') || '';
	const format = url.searchParams.get('format') || '';

	let query = locals.supabase
		.from('photos')
		.select(`
			id,
			image_url,
			caption,
			film_stock,
			camera,
			format,
			created_at,
			profiles!photos_user_id_fkey ( username )
		`)
		.order('created_at', { ascending: false })
		.limit(12);

	if (camera) query = query.eq('camera', camera);
	if (film) query = query.eq('film_stock', film);
	if (lens) query = query.eq('lens', lens);
	if (format) query = query.eq('format', format);

	const { data: photos } = await query;

	// fetch distinct values for filter tags
	const { data: allPhotos } = await locals.supabase
		.from('photos')
		.select('camera, film_stock, lens, format');

	const cameras = [...new Set((allPhotos ?? []).map((p: { camera?: string }) => p.camera).filter(Boolean))].sort();
	const films = [...new Set((allPhotos ?? []).map((p: { film_stock?: string }) => p.film_stock).filter(Boolean))].sort();
	const lenses = [...new Set((allPhotos ?? []).map((p: { lens?: string }) => p.lens).filter(Boolean))].sort();
	const formats = [...new Set((allPhotos ?? []).map((p: { format?: string }) => p.format).filter(Boolean))].sort();

	const hasFilter = !!(camera || film || lens || format);

	return {
		photos: photos ?? [],
		cameras,
		films,
		lenses,
		formats,
		tags: [] as string[],
		activeCamera: camera,
		activeFilm: film,
		activeLens: lens,
		activeFormat: format,
		hasFilter
	};
};
