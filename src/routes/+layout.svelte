<script lang="ts">
	import '../app.css';
	import { invalidate } from '$app/navigation';
	import { onMount } from 'svelte';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: any } = $props();

	onMount(() => {
		const {
			data: { subscription }
		} = data.supabase!.auth.onAuthStateChange((_event: string, _session: unknown) => {
			invalidate('supabase:auth');
		});

		return () => subscription.unsubscribe();
	});

	async function handleLogout() {
		await data.supabase!.auth.signOut();
		invalidate('supabase:auth');
	}
</script>

<nav class="top-nav">
	<div class="nav-inner">
		<a href="/" class="site-name">8and36</a>
		<div class="nav-links">
			{#if data.session}
				<a href="/user/{data.profile?.username ?? ''}">{data.profile?.username ?? 'me'}</a>
				<span class="sep">/</span>
				<a href="/settings">settings</a>
				<span class="sep">/</span>
				<button class="text-btn" onclick={handleLogout}>log out</button>
				<span class="sep">/</span>
				<a href="/upload" class="upload-btn">+ upload</a>
			{:else}
				<a href="/login">log in</a>
				<span class="sep">/</span>
				<a href="/signup">sign up</a>
			{/if}
		</div>
	</div>
</nav>

{@render children()}
