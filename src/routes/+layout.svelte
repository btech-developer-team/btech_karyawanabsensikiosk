<script>
	import '$lib/styles/bootstrap.scss';
	import { onMount } from 'svelte';
	import InstallPrompt from '$lib/components/InstallPrompt.svelte';
	import OfflineBadge from '$lib/components/OfflineBadge.svelte';

	let { children } = $props();

	onMount(async () => {
		// kiosk menyimpan absensi offline: minta storage persisten supaya tidak kena eviction
		if (navigator.storage?.persist && !(await navigator.storage.persisted())) {
			await navigator.storage.persist();
		}
	});
</script>

<svelte:head>
	<title>Kiosk Absensi B Erl</title>
</svelte:head>

{@render children()}
<OfflineBadge />
<InstallPrompt />

<style>
	:global(html, body) {
		height: 100%;
		margin: 0;
		overflow: hidden;
		background: #f4f1ea;
	}
</style>
