<script lang="ts">
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';

	let { data }: { data: PageData } = $props();

	const MAX_DIMENSION = 2048;
	const JPEG_QUALITY = 0.85;

	let file: File | null = $state(null);
	let preview = $state('');
	let caption = $state('');
	let camera = $state(data.lastCamera ?? '');
	let filmStock = $state(data.lastFilm ?? '');
	let lens = $state(data.lastLens ?? '');
	let format = $state(data.lastFormat ?? '');
	let tagsInput = $state('');
	let errorMsg = $state('');
	let loading = $state(false);
	let status = $state('');
	let fileInfo = $state('');
	let dragging = $state(false);

	function resizeImage(file: File): Promise<Blob> {
		return new Promise((resolve, reject) => {
			const img = new Image();
			img.onload = () => {
				let { width, height } = img;
				const longest = Math.max(width, height);

				if (longest <= MAX_DIMENSION) {
					const canvas = document.createElement('canvas');
					canvas.width = width;
					canvas.height = height;
					const ctx = canvas.getContext('2d')!;
					ctx.drawImage(img, 0, 0);
					canvas.toBlob(
						(blob) => (blob ? resolve(blob) : reject(new Error('resize failed'))),
						'image/jpeg',
						JPEG_QUALITY
					);
					return;
				}

				const scale = MAX_DIMENSION / longest;
				width = Math.round(width * scale);
				height = Math.round(height * scale);

				const canvas = document.createElement('canvas');
				canvas.width = width;
				canvas.height = height;
				const ctx = canvas.getContext('2d')!;
				ctx.drawImage(img, 0, 0, width, height);
				canvas.toBlob(
					(blob) => (blob ? resolve(blob) : reject(new Error('resize failed'))),
					'image/jpeg',
					JPEG_QUALITY
				);
			};
			img.onerror = () => reject(new Error('could not read image'));
			img.src = URL.createObjectURL(file);
		});
	}

	function formatSize(bytes: number) {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}

	function setFile(f: File) {
		file = f;
		fileInfo = `${f.name} · ${formatSize(f.size)}`;
		preview = URL.createObjectURL(f);
	}

	function handleFile(e: Event) {
		const target = e.target as HTMLInputElement;
		const f = target.files?.[0];
		if (f) setFile(f);
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		dragging = true;
	}

	function handleDragLeave() {
		dragging = false;
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		dragging = false;
		const f = e.dataTransfer?.files?.[0];
		if (f && f.type.startsWith('image/')) setFile(f);
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!file) {
			errorMsg = 'please select a photo';
			return;
		}
		if (!data.session || !data.user) {
			errorMsg = 'you must be logged in';
			return;
		}
		if (!caption.trim()) {
			errorMsg = 'caption is required';
			return;
		}
		if (!camera.trim()) {
			errorMsg = 'camera is required';
			return;
		}
		if (!filmStock.trim()) {
			errorMsg = 'film stock is required';
			return;
		}
		if (!lens.trim()) {
			errorMsg = 'lens is required';
			return;
		}
		if (!format) {
			errorMsg = 'format is required';
			return;
		}
		const tagNames = tagsInput
			.split(',')
			.map((t) => t.trim().toLowerCase().replace(/^#/, ''))
			.filter((t) => t.length > 0);
		if (tagNames.length === 0) {
			errorMsg = 'at least one tag is required';
			return;
		}

		loading = true;
		errorMsg = '';
		status = 'resizing...';

		try {
			const supabase = data.supabase!;
			const userId = data.user.id;

			const resized = await resizeImage(file);
			const filePath = `${userId}/${Date.now()}.jpg`;

			status = 'uploading...';

			const { error: uploadErr } = await supabase.storage
				.from('photos')
				.upload(filePath, resized, { contentType: 'image/jpeg' });

			if (uploadErr) throw uploadErr;

			const { data: urlData } = supabase.storage
				.from('photos')
				.getPublicUrl(filePath);

			const imageUrl = urlData.publicUrl;

			status = 'saving...';

			const { data: photo, error: insertErr } = await supabase
				.from('photos')
				.insert({
					user_id: userId,
					image_url: imageUrl,
					caption,
					camera,
					film_stock: filmStock,
					lens,
					format
				})
				.select('id')
				.single();

			if (insertErr) throw insertErr;

			for (const name of tagNames) {
				const { data: existingTag } = await supabase
					.from('tags')
					.select('id')
					.eq('name', name)
					.single();

				let tagId: number;
				if (existingTag) {
					tagId = existingTag.id;
				} else {
					const { data: newTag, error: tagErr } = await supabase
						.from('tags')
						.insert({ name })
						.select('id')
						.single();
					if (tagErr) continue;
					tagId = newTag.id;
				}

				await supabase.from('photo_tags').insert({
					photo_id: photo.id,
					tag_id: tagId
				});
			}

			goto(`/photo/${photo.id}`);
		} catch (err: any) {
			errorMsg = err.message || 'something went wrong';
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>upload — 36and8</title>
</svelte:head>

<div class="upload-page">
	<h1>upload a photo</h1>

	<form onsubmit={handleSubmit}>
		<div
			class="file-input-wrapper"
			class:has-preview={!!preview}
			class:dragging
			role="button"
			tabindex="0"
			ondragover={handleDragOver}
			ondragleave={handleDragLeave}
			ondrop={handleDrop}
		>
			<input type="file" accept="image/*" onchange={handleFile} />
			{#if preview}
				<img src={preview} alt="preview" class="preview-img" />
				<span class="change-hint">{fileInfo} · click to change</span>
			{:else}
				<span class="placeholder">
					{dragging ? 'drop it here' : 'click or drag to select an image'}
				</span>
			{/if}
		</div>

		<label>
			caption
			<textarea bind:value={caption} placeholder="caption" required></textarea>
		</label>

		<label>
			camera
			<input type="text" bind:value={camera} placeholder="e.g. Canon AE-1" list="cameras-list" required />
			<datalist id="cameras-list">
				{#each data.cameras as cam}
					<option value={cam} />
				{/each}
			</datalist>
		</label>

		<label>
			film stock
			<input type="text" bind:value={filmStock} placeholder="e.g. Portra 400" list="films-list" required />
			<datalist id="films-list">
				{#each data.films as film}
					<option value={film} />
				{/each}
			</datalist>
		</label>

		<label>
			lens
			<input type="text" bind:value={lens} placeholder="e.g. 50mm f/1.4" list="lenses-list" required />
			<datalist id="lenses-list">
				{#each data.lenses as l}
					<option value={l} />
				{/each}
			</datalist>
		</label>

		<label>
			format
			<select bind:value={format} required>
				<option value="">—</option>
				<option value="35mm">35mm</option>
				<option value="120">120</option>
			</select>
		</label>

		<label>
			tags
			<input type="text" bind:value={tagsInput} placeholder="comma separated: street, portrait" required />
		</label>

		{#if errorMsg}
			<p class="error">{errorMsg}</p>
		{/if}

		<button type="submit" disabled={loading}>
			{loading ? status : 'post ->'}
		</button>
		{#if loading}
			<p class="upload-status">{status}</p>
		{/if}
	</form>
</div>
