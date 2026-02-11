<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>#{data.tag.name} — 36and8</title>
	<meta property="og:title" content="#{data.tag.name}" />
	<meta property="og:description" content="{data.photos.length} photo{data.photos.length === 1 ? '' : 's'} tagged #{data.tag.name}" />
</svelte:head>

<div class="container">
	<div class="profile-header">
		<h1>#{data.tag.name}</h1>
		<p style="font-size: 0.8rem; color: var(--fg-muted);">
			{data.photos.length} photo{data.photos.length === 1 ? '' : 's'}
		</p>
	</div>

	{#if data.photos.length === 0}
		<p class="empty">no photos with this tag yet.</p>
	{:else}
		<div class="photo-grid">
			{#each data.photos as photo}
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
						</div>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>
