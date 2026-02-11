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

	const cameras = [...new Set((allPhotos ?? []).map((p: any) => p.camera).filter(Boolean))].sort();
	const films = [...new Set((allPhotos ?? []).map((p: any) => p.film_stock).filter(Boolean))].sort();
	const lenses = [...new Set((allPhotos ?? []).map((p: any) => p.lens).filter(Boolean))].sort();
	const formats = [...new Set((allPhotos ?? []).map((p: any) => p.format).filter(Boolean))].sort();

	// fetch user-created tags
	const { data: allTags } = await locals.supabase
		.from('tags')
		.select('name')
		.order('name');

	const tagNames = (allTags ?? []).map((t: any) => t.name);

	const hasFilter = !!(camera || film || lens || format);

	return {
		photos: photos ?? [],
		cameras,
		films,
		lenses,
		formats,
		tags: tagNames,
		activeCamera: camera,
		activeFilm: film,
		activeLens: lens,
		activeFormat: format,
		hasFilter
	};
};
