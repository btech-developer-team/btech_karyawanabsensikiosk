<script>
	import { loading } from '$lib/loading.svelte.js';
</script>

<div class="sync-indicator" class:is-active={loading.active}>
	<span class="spinner-border spinner-border-sm"></span>
	<span>{loading.text}</span>
</div>

<style>
	.sync-indicator {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		min-height: 31px;
		padding: 4px 12px;
		border: 1px solid #c0b283;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.85);
		color: #7a6a3a;
		font-size: 0.85rem;
		white-space: nowrap;
		visibility: hidden;
	}

	.is-active {
		visibility: visible;
	}
</style>
