<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>all tags — 8and36</title>
</svelte:head>

<div class="container">
	<div class="profile-header">
		<h1>all tags</h1>
		<p style="font-size: 0.8rem; color: var(--fg-muted);">{data.tags.length} tag{data.tags.length === 1 ? '' : 's'}</p>
	</div>

	<div class="filter-group" style="flex-wrap: wrap; gap: 0.5rem;">
		{#each data.tags as tag}
			<a href="/tag/{tag}" class="hashtag">#{tag}</a>
		{/each}
	</div>
</div>
