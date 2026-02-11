import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const PAGE_SIZE = 12;

export const GET: RequestHandler = async ({ url, locals }) => {
	const offset = parseInt(url.searchParams.get('offset') || '0');
	const camera = url.searchParams.get('camera');
	const film = url.searchParams.get('film');
	const lens = url.searchParams.get('lens');
	const format = url.searchParams.get('format');

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
		.range(offset, offset + PAGE_SIZE - 1);

	if (camera) query = query.eq('camera', camera);
	if (film) query = query.eq('film_stock', film);
	if (lens) query = query.eq('lens', lens);
	if (format) query = query.eq('format', format);

	const { data: photos } = await query;

	return json({
		photos: photos ?? [],
		hasMore: (photos ?? []).length === PAGE_SIZE
	});
};
