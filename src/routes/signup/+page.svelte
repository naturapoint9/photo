<script lang="ts">
	import type { PageData } from './$types';
	import { goto, invalidate } from '$app/navigation';

	let { data }: { data: PageData } = $props();

	let email = $state('');
	let username = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);

	async function handleSignup(e: Event) {
		e.preventDefault();
		loading = true;
		error = '';

		if (username.length < 2) {
			error = 'username must be at least 2 characters';
			loading = false;
			return;
		}

		if (!/^[a-z0-9_]+$/.test(username)) {
			error = 'username: lowercase letters, numbers, underscores only';
			loading = false;
			return;
		}

		const { error: err } = await data.supabase!.auth.signUp({
			email,
			password,
			options: {
				data: { username }
			}
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
	<title>sign up — 36and8</title>
</svelte:head>

<div class="auth-page">
	<h1>sign up</h1>

	<form onsubmit={handleSignup}>
		<label>
			username
			<input
				type="text"
				bind:value={username}
				required
				autocomplete="username"
				placeholder="lowercase, no spaces"
			/>
		</label>

		<label>
			email
			<input type="email" bind:value={email} required autocomplete="email" />
		</label>

		<label>
			password
			<input
				type="password"
				bind:value={password}
				required
				autocomplete="new-password"
				minlength="6"
			/>
		</label>

		{#if error}
			<p class="error">{error}</p>
		{/if}

		<button type="submit" disabled={loading}>
			{loading ? 'creating account...' : 'sign up ->'}
		</button>
	</form>

	<p class="alt-link">already have an account? <a href="/login">log in</a></p>
</div>
