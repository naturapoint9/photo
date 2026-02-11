<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { timeAgo, fullDate } from '$lib/utils';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let editing = $state(false);
	let editCaption = $state('');
	let editCamera = $state('');
	let editFilmStock = $state('');
	let editLens = $state('');
	let editTags = $state('');

	function startEdit() {
		editCaption = data.photo.caption ?? '';
		editCamera = data.photo.camera ?? '';
		editFilmStock = data.photo.film_stock ?? '';
		editLens = data.photo.lens ?? '';
		editTags = tags.map((t: any) => t.name).join(', ');
		editing = true;
	}

	function cancelEdit() {
		editing = false;
	}

	function handleEditDone() {
		return async ({ result }: { result: any }) => {
			if (result.type === 'success' && result.data?.edited) {
				editing = false;
			}
		};
	}

	function handleDelete() {
		return ({ cancel }: { cancel: () => void }) => {
			if (!confirm('are you sure you want to delete this photo?')) {
				cancel();
				return;
			}
			return async ({ result }: { result: any }) => {
				if (result.type === 'success' && result.data?.deleted) {
					goto('/');
				}
			};
		};
	}

	const tags = $derived(
		(data.photo.photo_tags ?? [])
			.map((pt: any) => pt.tags)
			.filter(Boolean)
	);

	const isOwner = $derived(
		data.session?.user?.id === data.photo.user_id
	);
</script>

<svelte:head>
	<title>{data.photo.caption || 'photo'} — 36and8</title>
	<meta property="og:title" content={data.photo.caption || 'photo'} />
	<meta property="og:description" content={[data.photo.profiles?.username, data.photo.camera, data.photo.film_stock].filter(Boolean).join(' · ') || '36and8'} />
	<meta property="og:image" content={data.photo.image_url} />
	<meta property="og:type" content="article" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={data.photo.caption || 'photo'} />
	<meta name="twitter:image" content={data.photo.image_url} />
</svelte:head>

<div class="photo-detail">
	<div class="photo-main">
		<img src={data.photo.image_url} alt={data.photo.caption || 'photo'} />
	</div>

	{#if data.photo.caption}
		<p class="photo-caption">{data.photo.caption}</p>
	{/if}

	<div class="photo-byline">
		<a href="/user/{data.photo.profiles?.username}">{data.photo.profiles?.username}</a>
		<span class="sep">·</span>
		<span title={fullDate(data.photo.created_at)}>{timeAgo(data.photo.created_at)}</span>
	</div>

	{#if editing}
		<form method="POST" action="?/edit" use:enhance={handleEditDone} class="edit-form">
			<label>
				caption
				<textarea name="caption" bind:value={editCaption} placeholder="caption"></textarea>
			</label>

			<label>
				camera
				<input type="text" name="camera" bind:value={editCamera} placeholder="e.g. Canon AE-1" />
			</label>

			<label>
				film stock
				<input type="text" name="film_stock" bind:value={editFilmStock} placeholder="e.g. Portra 400" />
			</label>

			<label>
				lens
				<input type="text" name="lens" bind:value={editLens} placeholder="e.g. 50mm f/1.4" />
			</label>

			<label>
				tags
				<input type="text" name="tags" bind:value={editTags} placeholder="comma separated: street, portrait" />
			</label>

			<div style="display: flex; gap: 0.5rem;">
				<button type="submit">save -&gt;</button>
				<button type="button" class="secondary" onclick={cancelEdit}>cancel</button>
			</div>
		</form>
	{:else}
		{#if data.photo.camera || data.photo.film_stock || data.photo.lens || tags.length > 0}
			<div class="tags">
				{#if data.photo.camera}
					<a href="/?camera={encodeURIComponent(data.photo.camera)}" class="tag">{data.photo.camera}</a>
				{/if}
				{#if data.photo.film_stock}
					<a href="/?film={encodeURIComponent(data.photo.film_stock)}" class="tag">{data.photo.film_stock}</a>
				{/if}
				{#if data.photo.lens}
					<a href="/?lens={encodeURIComponent(data.photo.lens)}" class="tag">{data.photo.lens}</a>
				{/if}
				{#each tags as tag}
					<a href="/tag/{tag.name}" class="tag">#{tag.name}</a>
				{/each}
			</div>
		{/if}
	{/if}

	<div class="actions-bar">
		<form method="POST" action="?/like" use:enhance>
			<button type="submit" class="like-btn" class:liked={data.userLiked}>
				{data.userLiked ? '♥' : '♡'} {data.likeCount}
			</button>
		</form>

		{#if data.likes.length > 0}
			<span class="liked-by">
				{#each data.likes as like, i}<a href="/user/{like.profiles?.username}">{like.profiles?.username}</a>{#if i < data.likes.length - 1}, {/if}{/each}
			</span>
		{/if}

		{#if isOwner}
			{#if !editing}
				<button class="text-btn" style="font-size: 0.8rem; color: var(--fg-muted); margin-left: auto;" onclick={startEdit}>edit</button>
			{/if}
			<form method="POST" action="?/delete" use:enhance={handleDelete} style={editing ? 'margin-left: auto;' : ''}>
				<button type="submit" class="text-btn" style="font-size: 0.8rem; color: var(--fg-muted);">delete</button>
			</form>
		{/if}
	</div>

	<div class="comments-section">
		<h2>comments ({data.comments.length})</h2>

		{#each data.comments as comment}
			<div class="comment">
				<div class="comment-header">
					<a href="/user/{comment.profiles?.username}" class="author">{comment.profiles?.username}</a>
					<span class="date" title={fullDate(comment.created_at)}>{timeAgo(comment.created_at)}</span>
				</div>
				<div class="comment-body">{comment.body}</div>
			</div>
		{/each}

		{#if data.session}
			<form method="POST" action="?/comment" use:enhance class="comment-form">
				<textarea name="body" placeholder="say something..." required></textarea>
				{#if form?.error}
					<p class="error">{form.error}</p>
				{/if}
				<button type="submit">post comment -&gt;</button>
			</form>
		{:else}
			<p style="font-size: 0.8rem; color: var(--fg-muted); margin-top: 1rem;">
				<a href="/login">log in</a> to leave a comment
			</p>
		{/if}
	</div>
</div>
