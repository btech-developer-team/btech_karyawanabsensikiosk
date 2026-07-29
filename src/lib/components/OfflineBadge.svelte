<script>
	import { onMount } from 'svelte';

	let online = $state(true);

	onMount(() => {
		const update = () => (online = navigator.onLine);
		update();
		window.addEventListener('online', update);
		window.addEventListener('offline', update);
		return () => {
			window.removeEventListener('online', update);
			window.removeEventListener('offline', update);
		};
	});
</script>

{#if !online}
	<div class="offline-badge">
		<strong>Mode offline.</strong> Absensi tetap tersimpan dan dikirim otomatis saat online.
	</div>
{/if}

<style>
	.offline-badge {
		position: fixed;
		left: 12px;
		bottom: 12px;
		z-index: 1080;
		background: #dc3545;
		color: #fff;
		border-radius: 999px;
		padding: 8px 16px;
		font-size: 13px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
	}
</style>
