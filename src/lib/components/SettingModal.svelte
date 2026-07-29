<script>
	import { scanner, STATUS } from '$lib/scanner.svelte.js';

	const PASSWORD = 'BerlDev123#';

	let { open = $bindable(false) } = $props();

	let step = $state('password'); // 'password' | 'settings'
	let input = $state('');
	let error = $state('');
	let showPass = $state(false);

	function tryLogin() {
		if (input === PASSWORD) {
			step = 'settings';
			error = '';
			input = '';
		} else {
			error = 'Password salah. Coba lagi.';
			input = '';
		}
	}

	function close() {
		open = false;
		step = 'password';
		input = '';
		error = '';
	}

	async function onForget(index, name) {
		if (!confirm(`Lupakan izin untuk ${name}?`)) return;
		await scanner.forget(index);
	}

	function statusClass(status) {
		if (status === STATUS.listening) return 'text-success';
		if ([STATUS.error, STATUS.failed, STATUS.lost].includes(status)) return 'text-danger';
		return 'text-warning';
	}

	const slotCount = scanner.slots.length;
</script>

{#if open}
	<!-- backdrop -->
	<div class="modal-backdrop" onclick={close} role="presentation"></div>

	<div class="setting-modal" role="dialog" aria-modal="true" aria-label="Pengaturan Kiosk">
		<div class="modal-header">
			<h5 class="modal-title mb-0">⚙️ Pengaturan Kiosk</h5>
			<button class="btn-close" onclick={close} aria-label="Tutup"></button>
		</div>

		<div class="modal-body">
			{#if step === 'password'}
				<p class="text-muted small mb-3">Masukkan password untuk mengakses pengaturan.</p>
				<form onsubmit={(e) => { e.preventDefault(); tryLogin(); }}>
					<div class="input-group mb-2">
						<input
							type={showPass ? 'text' : 'password'}
							class="form-control"
							placeholder="Password"
							bind:value={input}
							autofocus
						/>
						<button
							type="button"
							class="btn btn-outline-secondary"
							onclick={() => (showPass = !showPass)}
						>
							{showPass ? '🙈' : '👁️'}
						</button>
					</div>
					{#if error}
						<p class="text-danger small mb-2">{error}</p>
					{/if}
					<button type="submit" class="btn btn-primary w-100">Masuk</button>
				</form>
			{:else}
				<h6 class="mb-3">Manajemen USB COM</h6>

				<div class="usb-list">
					{#each Array.from({ length: slotCount }, (_, i) => i) as index (index)}
						{@const slot = scanner.slots[index]}
						<div class="usb-item card mb-2">
							<div class="card-body p-3">
								<div class="d-flex align-items-center justify-content-between mb-2">
									<div>
										<span class="fw-semibold">{slot?.name ?? `USB COM ${index + 1}`}</span>
										<span class="ms-2 small {slot ? statusClass(slot.status) : 'text-muted'}">
											{slot?.status ?? STATUS.empty}
										</span>
									</div>
									<div class="d-flex gap-1">
										<button
											type="button"
											class="btn btn-sm {slot?.status === STATUS.listening || slot?.busy
												? 'btn-danger'
												: 'btn-primary'}"
											disabled={slot?.busy}
											onclick={() => scanner.connect(index)}
										>
											{slot?.status === STATUS.listening || slot?.busy ? 'Disconnect' : 'Connect'}
										</button>
										{#if slot}
											<button
												type="button"
												class="btn btn-sm btn-outline-secondary"
												disabled={slot.busy}
												onclick={() => scanner.change(index)}
											>
												Ganti
											</button>
											<button
												type="button"
												class="btn btn-sm btn-outline-danger"
												disabled={slot.busy}
												onclick={() => onForget(index, slot.name)}
											>
												Lupakan
											</button>
										{/if}
									</div>
								</div>
							</div>
						</div>
					{/each}
				</div>

				{#if !scanner.supported}
					<p class="small text-danger mt-2 mb-0">
						Browser ini tidak mendukung Web Serial. Pakai Chrome/Edge di localhost atau HTTPS.
					</p>
				{/if}
			{/if}
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		z-index: 1040;
	}

	.setting-modal {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		z-index: 1050;
		background: #fff;
		border-radius: 12px;
		width: min(480px, 95vw);
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
		overflow: hidden;
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.25rem;
		border-bottom: 1px solid #dee2e6;
		background: #f8f5ef;
	}

	.modal-body {
		padding: 1.25rem;
		max-height: 70vh;
		overflow-y: auto;
	}

	.usb-list {
		display: flex;
		flex-direction: column;
	}
</style>
