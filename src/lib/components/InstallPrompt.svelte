<script>
	import { onMount } from 'svelte';

	let deferred = $state(null);

	onMount(() => {
		const onPrompt = (event) => {
			event.preventDefault();
			deferred = event;
		};
		const onInstalled = () => (deferred = null);
		window.addEventListener('beforeinstallprompt', onPrompt);
		window.addEventListener('appinstalled', onInstalled);
		return () => {
			window.removeEventListener('beforeinstallprompt', onPrompt);
			window.removeEventListener('appinstalled', onInstalled);
		};
	});

	async function install() {
		const prompt = deferred;
		deferred = null;
		await prompt?.prompt();
	}
</script>

{#if deferred}
	<div class="install-prompt">
		<span class="small">Pasang kiosk ini sebagai aplikasi?</span>
		<button type="button" class="btn btn-sm btn-light" onclick={install}>Install</button>
		<button
			type="button"
			class="btn btn-sm btn-outline-light"
			onclick={() => (deferred = null)}
		>
			Nanti
		</button>
	</div>
{/if}

<style>
	.install-prompt {
		position: fixed;
		right: 12px;
		bottom: 12px;
		z-index: 1080;
		display: flex;
		align-items: center;
		gap: 8px;
		background: var(--bs-primary);
		color: #fff;
		border-radius: 999px;
		padding: 8px 14px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
	}
</style>
