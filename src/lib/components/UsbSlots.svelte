<script>
	import { USB_SLOT_COUNT, DEFAULT_AVATAR } from '$lib/config.js';
	import { scanner, STATUS } from '$lib/scanner.svelte.js';

	/**
	 * lastScans: array indexed by slot — { id, nama, avatar } karyawan terakhir per slot.
	 * Diisi dari luar (+page.svelte) tiap kali ada scan sukses.
	 */
	let { lastScans = [] } = $props();

	const slotIndexes = Array.from({ length: USB_SLOT_COUNT }, (_, i) => i);

	function statusClass(status) {
		if (status === STATUS.listening) return 'text-success';
		if ([STATUS.error, STATUS.failed, STATUS.lost].includes(status)) return 'text-danger';
		return 'text-warning';
	}
</script>

<div class="row g-2">
	{#each slotIndexes as index (index)}
		{@const slot = scanner.slots[index]}
		{@const last = lastScans[index]}
		<div class="col-6">
			<div class="card">
				<div class="card-body p-2">
					<!-- Info port -->
					<div class="slot-header text-center">
						<h6 class="mb-0 slot-name">{slot?.name ?? `USB COM ${index + 1}`}</h6>
						<span class="badge rounded-pill {slot ? statusClass(slot.status) : 'text-muted'}"></span>
					</div>
	
					<!-- Karyawan terakhir scan dari slot ini -->
					<div class="last-scan mt-2">
						{#if last}
							<img
								class="scan-avatar"
								src={last.avatar || DEFAULT_AVATAR}
								alt={last.nama}
							/>
							<div class="scan-info">
								<span class="scan-code">{last.id}</span>
								<span class="scan-nama">{last.nama}</span>
							</div>
						{:else}
							<div class="no-scan text-muted small">Belum ada scan</div>
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

<style>
	.usb-slots {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		gap: 8px;
	}

	.usb-slot {
		flex: 1 1 0;
		min-width: 0;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
	}

	.slot-header {
		border-bottom: 1px solid #e9ecef;
		padding-bottom: 6px;
	}

	.slot-name {
		font-size: 0.78rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.last-scan {
		display: flex;
		align-items: center;
		gap: 8px;
		min-height: 44px;
	}

	.scan-avatar {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		object-fit: cover;
		border: 2px solid var(--bs-primary);
		flex-shrink: 0;
	}

	.scan-info {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.scan-code {
		font-size: 0.7rem;
		color: #888;
		line-height: 1.2;
	}

	.scan-nama {
		font-size: 0.82rem;
		font-weight: 600;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		color: #333;
	}

	.no-scan {
		width: 100%;
		text-align: center;
		font-size: 0.75rem;
	}
</style>
