<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import { timeAgo } from '$lib/utils';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let tab: 'gallery' | 'favorites' | 'shoutbox' = $state('gallery');

	function memberSince(dateStr: string) {
		return new Date(dateStr).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short'
		});
	}
</script>

<svelte:head>
	<title>{data.profile.username} — 36and8</title>
	<meta property="og:title" content={data.profile.username} />
	<meta property="og:description" content={data.profile.bio || `${data.photoCount} photo${data.photoCount === 1 ? '' : 's'} on 36and8`} />
	{#if data.profile.avatar_url}
		<meta property="og:image" content={data.profile.avatar_url} />
	{/if}
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

	<div class="profile-tabs">
		<button class="profile-tab" class:active={tab === 'gallery'} onclick={() => tab = 'gallery'}>
			gallery ({data.photoCount})
		</button>
		<button class="profile-tab" class:active={tab === 'favorites'} onclick={() => tab = 'favorites'}>
			favorites ({data.favorites.length})
		</button>
		<button class="profile-tab" class:active={tab === 'shoutbox'} onclick={() => tab = 'shoutbox'}>
			shoutbox ({data.shoutbox.length})
		</button>
	</div>

	{#if tab === 'gallery'}
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
	{:else if tab === 'favorites'}
		{#if data.favorites.length === 0}
			<p class="empty">no favorites yet.</p>
		{:else}
			<div class="photo-grid">
				{#each data.favorites as photo}
					<a href="/photo/{photo.id}" class="photo-card" style="text-decoration: none;">
						<img src={photo.image_url} alt={photo.caption || 'photo'} loading="lazy" />
						<div class="card-info">
							{#if photo.caption}
								<div class="caption">{photo.caption}</div>
							{/if}
							{#if photo.profiles?.username}
								<div class="meta">{photo.profiles.username}</div>
							{/if}
						</div>
					</a>
				{/each}
			</div>
		{/if}
	{:else}
		<div class="shoutbox">
			{#if data.session}
				<form method="POST" action="?/shout" use:enhance class="shoutbox-form">
					<textarea name="body" placeholder="leave a message..." required></textarea>
					{#if form?.error}
						<p class="error">{form.error}</p>
					{/if}
					<button type="submit">shout -&gt;</button>
				</form>
			{:else}
				<p class="empty"><a href="/login">log in</a> to leave a message</p>
			{/if}

			<div class="shoutbox-list">
				{#each data.shoutbox as shout}
					{@const author = Array.isArray(shout.profiles) ? shout.profiles[0] : shout.profiles}
					<div class="shoutbox-item">
						<div class="shoutbox-header">
							<a href="/user/{author?.username ?? 'unknown'}" class="author">{author?.username ?? 'unknown'}</a>
							<span class="date" title={new Date(shout.created_at).toLocaleString()}>{timeAgo(shout.created_at)}</span>
						</div>
						<div class="shoutbox-body">{shout.body}</div>
					</div>
				{/each}
			</div>

			{#if data.shoutbox.length === 0}
				<p class="empty">no messages yet.</p>
			{/if}
		</div>
	{/if}
</div>
