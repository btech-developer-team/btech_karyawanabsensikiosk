<script>
	import { getToasts, removeToast } from '$lib/toast.svelte.js';

	function headerClass(type) {
		if (type === 'success') return 'text-bg-success';
		if (type === 'warning') return 'text-bg-warning';
		if (type === 'info') return 'text-bg-info';
		return 'text-bg-danger';
	}
</script>

<div class="toast-container position-fixed top-0 end-0 p-3" style="z-index: 1090">
	{#each getToasts() as t (t.id)}
		<div
			class="toast show {headerClass(t.type)}"
			role="alert"
			aria-live="assertive"
			aria-atomic="true"
		>
			<div class="toast-header {headerClass(t.type)} border-0">
				<strong class="me-auto">{t.title || 'Notifikasi'}</strong>
				<button
					type="button"
					class="btn-close btn-close-white"
					aria-label="Tutup"
					onclick={() => removeToast(t.id)}
				></button>
			</div>
			{#if t.body}
				<div class="toast-body">{t.body}</div>
			{/if}
		</div>
	{/each}
</div>
