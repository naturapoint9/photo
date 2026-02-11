<script lang="ts">
	import type { PageData } from './$types';
	import { goto, invalidate } from '$app/navigation';

	let { data }: { data: PageData } = $props();

	let email = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);

	async function handleLogin(e: Event) {
		e.preventDefault();
		loading = true;
		error = '';

		const { error: err } = await data.supabase!.auth.signInWithPassword({
			email,
			password
		});

		if (err) {
			error = err.message;
			loading = false;
			return;
		}

		await invalidate('supabase:auth');
		goto('/');
	}
</script>

<svelte:head>
	<title>log in — 36and8</title>
</svelte:head>

<div class="auth-page">
	<h1>log in</h1>

	<form onsubmit={handleLogin}>
		<label>
			email
			<input type="email" bind:value={email} required autocomplete="email" />
		</label>

		<label>
			password
			<input type="password" bind:value={password} required autocomplete="current-password" />
		</label>

		{#if error}
			<p class="error">{error}</p>
		{/if}

		<button type="submit" disabled={loading}>
			{loading ? 'logging in...' : 'log in ->'}
		</button>
	</form>

	<p class="alt-link">no account? <a href="/signup">sign up</a></p>
</div>
