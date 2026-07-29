<script>
	import '$lib/styles/bootstrap.scss';
	import { onMount } from 'svelte';
	import { pwaInfo } from 'virtual:pwa-info';
	import InstallPrompt from '$lib/components/InstallPrompt.svelte';
	import OfflineBadge from '$lib/components/OfflineBadge.svelte';

	let { children } = $props();

	const webManifestLink = $derived(pwaInfo?.webManifest?.linkTag ?? '');

	onMount(async () => {
		// kiosk menyimpan absensi offline: minta storage persisten supaya tidak kena eviction
		if (navigator.storage?.persist && !(await navigator.storage.persisted())) {
			await navigator.storage.persist();
		}
		if (pwaInfo) {
			const { registerSW } = await import('virtual:pwa-register');
			registerSW({ immediate: true });
		}
	});
</script>

<svelte:head>
	<title>Kiosk Absensi B Erl</title>
	{@html webManifestLink}
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
