<script lang="ts">
	import type { PageData } from './$types';
	import { timeAgo, fullDate } from '$lib/utils';
	import { onMount } from 'svelte';

	let { data }: { data: PageData } = $props();

	let photos = $state([...(data.photos ?? [])]);
	let loading = $state(false);
	let hasMore = $state((data.photos ?? []).length === 12);
	let sentinel: HTMLElement;
	// reset when data changes (e.g. filter applied)
	$effect(() => {
		const p = data.photos ?? [];
		photos = [...p];
		hasMore = p.length === 12;
	});

	function buildFilterParams() {
		const params = new URLSearchParams();
		if (data.activeCamera) params.set('camera', data.activeCamera);
		if (data.activeFilm) params.set('film', data.activeFilm);
		if (data.activeLens) params.set('lens', data.activeLens);
		if (data.activeFormat) params.set('format', data.activeFormat);
		const str = params.toString();
		return str ? `&${str}` : '';
	}

	// build a filter URL that toggles a value while preserving others
	function filterUrl(type: string, value: string): string {
		const params = new URLSearchParams();
		const current = {
			camera: data.activeCamera,
			film: data.activeFilm,
			lens: data.activeLens,
			format: data.activeFormat
		} as Record<string, string>;

		// toggle: if already active, remove it; otherwise set it
		for (const [key, val] of Object.entries(current)) {
			if (key === type) {
				if (val !== value) params.set(key, value);
				// else: omit it (toggle off)
			} else if (val) {
				params.set(key, val);
			}
		}

		const str = params.toString();
		return str ? `/?${str}` : '/';
	}

	async function loadMore() {
		if (loading || !hasMore) return;
		loading = true;

		const res = await fetch(`/api/photos?offset=${photos.length}${buildFilterParams()}`);
		const result = await res.json();

		photos = [...photos, ...result.photos];
		hasMore = result.hasMore;
		loading = false;
	}

	onMount(() => {
		if (!sentinel) return;
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting) loadMore();
			},
			{ rootMargin: '200px' }
		);
		observer.observe(sentinel);
		return () => observer.disconnect();
	});

	const activeFilters = $derived(
		[
			data.activeFormat ? `${data.activeFormat}` : '',
			data.activeCamera ? `${data.activeCamera}` : '',
			data.activeFilm ? `${data.activeFilm}` : '',
			data.activeLens ? `${data.activeLens}` : ''
		].filter(Boolean)
	);
</script>

<svelte:head>
	<title>{activeFilters.length > 0 ? `${activeFilters.join(' + ')} — 36and8` : '36and8 — analog photo sharing'}</title>
	<meta property="og:title" content={activeFilters.length > 0 ? `${activeFilters.join(' + ')} — 36and8` : '36and8'} />
	<meta property="og:description" content="analog photo sharing" />
	<meta property="og:url" content={data.canonicalUrl} />
	{#if (data.photos ?? []).length > 0}
		<meta property="og:image" content={data.photos[0].image_url} />
	{/if}
</svelte:head>

<div class="container">
	{#if data.hasFilter}
		<div class="profile-header">
			<h1>{activeFilters.join(' + ')}</h1>
			<p style="font-size: 0.8rem; color: var(--fg-muted);">
				<a href="/">clear all filters</a>
			</p>
		</div>
	{/if}

	{#if (data.formats ?? []).length > 0 || (data.cameras ?? []).length > 0 || (data.films ?? []).length > 0 || (data.lenses ?? []).length > 0 || (data.tags ?? []).length > 0}
		<div class="filter-tags">
			{#if data.formats.length > 0}
				<div class="filter-group">
					<span class="filter-label">format</span>
					{#each data.formats as fmt}
						<a href={filterUrl('format', fmt)} class="tag" class:active={data.activeFormat === fmt}>{fmt}</a>
					{/each}
				</div>
			{/if}
			{#if data.cameras.length > 0}
				<div class="filter-group">
					<span class="filter-label">camera</span>
					{#each data.cameras as cam}
						<a href={filterUrl('camera', cam)} class="tag" class:active={data.activeCamera === cam}>{cam}</a>
					{/each}
				</div>
			{/if}
			{#if data.films.length > 0}
				<div class="filter-group">
					<span class="filter-label">film</span>
					{#each data.films as film}
						<a href={filterUrl('film', film)} class="tag" class:active={data.activeFilm === film}>{film}</a>
					{/each}
				</div>
			{/if}
			{#if data.lenses.length > 0}
				<div class="filter-group">
					<span class="filter-label">lens</span>
					{#each data.lenses as l}
						<a href={filterUrl('lens', l)} class="tag" class:active={data.activeLens === l}>{l}</a>
					{/each}
				</div>
			{/if}
			{#if data.tags.length > 0}
				<div class="filter-group">
					<span class="filter-label">tags</span>
					{#each data.tags.slice(0, 50) as tag}
						<a href="/tag/{tag}" class="hashtag">#{tag}</a>
					{/each}
					{#if data.tags.length > 50}
						<a href="/tags" class="hashtag" style="font-weight: 500;">show all ({data.tags.length})</a>
					{/if}
				</div>
			{/if}
		</div>
	{/if}

	{#if photos.length === 0 && !loading}
		<p class="empty">
			{#if data.hasFilter}
				nothing here.
			{:else}
				no photos yet. <a href="/upload">upload one</a>.
			{/if}
		</p>
	{:else}
		<div class="photo-grid">
			{#each photos as photo (photo.id)}
				<a href="/photo/{photo.id}" class="photo-card" style="text-decoration: none;">
					<img src={photo.image_url} alt={photo.caption || 'photo'} loading="lazy" />
					<div class="card-info">
						{#if photo.caption}
							<div class="caption">{photo.caption}</div>
						{/if}
						<div class="meta">
							{photo.profiles?.username ?? 'unknown'}
							{#if photo.film_stock}
								 · {photo.film_stock}
							{/if}
							 · <span title={fullDate(photo.created_at)}>{timeAgo(photo.created_at)}</span>
						</div>
					</div>
				</a>
			{/each}
		</div>

		<div bind:this={sentinel} class="scroll-sentinel">
			{#if loading}
				<p class="loading">loading...</p>
			{:else if !hasMore}
				<p style="text-align: center; font-size: 0.8rem; color: var(--fg-muted); padding: 2rem 0;">·</p>
			{/if}
		</div>
	{/if}
</div>
