<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	function memberSince(dateStr: string) {
		return new Date(dateStr).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short'
		});
	}
</script>

<svelte:head>
	<title>{data.profile.username} — 8and36</title>
</svelte:head>

<div class="container">
	<div class="profile-header">
		<div class="profile-top">
			{#if data.profile.avatar_url}
				<img src={data.profile.avatar_url} alt="{data.profile.username}'s avatar" class="profile-avatar" />
			{:else}
				<div class="profile-avatar-placeholder">{data.profile.username.charAt(0)}</div>
			{/if}
			<div class="profile-identity">
				<h1>{data.profile.username}</h1>
				<p class="profile-stats">
					{data.photoCount} photo{data.photoCount === 1 ? '' : 's'} · member since {memberSince(data.profile.created_at)}
				</p>
			</div>
		</div>
		{#if data.profile.bio}
			<p class="profile-bio">{data.profile.bio}</p>
		{/if}
		{#if data.profile.link_youtube || data.profile.link_instagram || data.profile.link_tiktok}
			<div class="profile-socials">
				{#if data.profile.link_youtube}
					<a href={data.profile.link_youtube} target="_blank" rel="noopener noreferrer" class="social-link">youtube</a>
				{/if}
				{#if data.profile.link_instagram}
					<a href={data.profile.link_instagram} target="_blank" rel="noopener noreferrer" class="social-link">instagram</a>
				{/if}
				{#if data.profile.link_tiktok}
					<a href={data.profile.link_tiktok} target="_blank" rel="noopener noreferrer" class="social-link">tiktok</a>
				{/if}
			</div>
		{/if}
		{#if data.session?.user?.id === data.profile.id}
			<a href="/settings" class="profile-edit">edit profile</a>
		{/if}
	</div>

	{#if data.photos.length === 0}
		<p class="empty">no photos yet.</p>
	{:else}
		<div class="photo-grid">
			{#each data.photos as photo}
				<a href="/photo/{photo.id}" class="photo-card" style="text-decoration: none;">
					<img src={photo.image_url} alt={photo.caption || 'photo'} loading="lazy" />
					<div class="card-info">
						{#if photo.caption}
							<div class="caption">{photo.caption}</div>
						{/if}
						{#if photo.film_stock}
							<div class="meta">{photo.film_stock}</div>
						{/if}
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>
