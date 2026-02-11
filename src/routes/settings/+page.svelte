<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let avatarPreview: string | null = $state(null);

	function previewAvatar(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (file) {
			avatarPreview = URL.createObjectURL(file);
		}
	}
</script>

<svelte:head>
	<title>settings — 36and8</title>
</svelte:head>

<div class="auth-page">
	<h1>settings</h1>

	<div class="settings-section">
		<h2>profile picture</h2>
		<form method="POST" action="?/avatar" enctype="multipart/form-data" use:enhance={() => {
			return async ({ update }) => {
				await update();
				avatarPreview = null;
				invalidateAll();
			};
		}}>
			<div class="avatar-upload">
				<div class="avatar-current">
					{#if avatarPreview}
						<img src={avatarPreview} alt="preview" class="avatar-img" />
					{:else if data.profile?.avatar_url}
						<img src={data.profile.avatar_url} alt="avatar" class="avatar-img" />
					{:else}
						<div class="avatar-placeholder">{data.profile?.username?.charAt(0) ?? '?'}</div>
					{/if}
				</div>
				<div class="avatar-controls">
					<label class="avatar-file-label">
						choose image
						<input type="file" name="avatar" accept="image/*" onchange={previewAvatar} hidden />
					</label>
					<span class="avatar-hint">max 2 MB</span>
				</div>
			</div>

			{#if form?.avatarError}
				<p class="error">{form.avatarError}</p>
			{/if}

			{#if form?.avatarSuccess}
				<p style="font-size: 0.8rem; color: var(--fg-muted); margin-bottom: 0.5rem;">avatar updated.</p>
			{/if}

			<button type="submit">upload avatar -&gt;</button>
		</form>
	</div>

	<div class="settings-section">
		<h2>profile</h2>
		<form method="POST" action="?/profile" use:enhance={() => {
			return async ({ update }) => {
				await update({ reset: false });
			};
		}}>
			<label>
				username
				<input
					type="text"
					name="username"
					value={data.profile?.username ?? ''}
					required
					autocomplete="username"
					placeholder="lowercase, no spaces"
				/>
			</label>

			<label>
				bio
				<textarea name="bio" placeholder="bio">{data.profile?.bio ?? ''}</textarea>
			</label>

			<fieldset class="social-fields">
				<legend>social links</legend>
				<label>
					youtube
					<input
						type="url"
						name="link_youtube"
						value={data.profile?.link_youtube ?? ''}
						placeholder="https://youtube.com/@you"
					/>
				</label>
				<label>
					instagram
					<input
						type="url"
						name="link_instagram"
						value={data.profile?.link_instagram ?? ''}
						placeholder="https://instagram.com/you"
					/>
				</label>
				<label>
					tiktok
					<input
						type="url"
						name="link_tiktok"
						value={data.profile?.link_tiktok ?? ''}
						placeholder="https://tiktok.com/@you"
					/>
				</label>
			</fieldset>

			{#if form?.error}
				<p class="error">{form.error}</p>
			{/if}

			{#if form?.success}
				<p style="font-size: 0.8rem; color: var(--fg-muted); margin-bottom: 0.5rem;">saved.</p>
			{/if}

			<button type="submit">save -&gt;</button>
		</form>
	</div>
</div>
