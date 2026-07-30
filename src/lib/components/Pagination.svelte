<script>
	/**
	 * Pagination reusable.
	 * @param {number} page - halaman aktif (1-based), bindable
	 * @param {number} totalItems - total data setelah filter
	 * @param {number} pageSize - jumlah item per halaman
	 * @param {number} maxVisible - maks nomor halaman di tengah (default 5)
	 */
	let {
		page = $bindable(1),
		totalItems = 0,
		pageSize = 10,
		maxVisible = 5
	} = $props();

	const totalPages = $derived(Math.max(1, Math.ceil(totalItems / pageSize)));

	const pages = $derived.by(() => {
		const current = page;
		const total = totalPages;
		const list = [];

		if (total <= maxVisible) {
			for (let i = 1; i <= total; i++) list.push(i);
			return list;
		}

		const side = Math.floor(maxVisible / 2);

		if (current <= side + 1) {
			for (let i = 1; i < maxVisible; i++) list.push(i);
			list.push('...');
			list.push(total);
			return list;
		}

		if (current >= total - side) {
			list.push(1);
			list.push('...');
			for (let i = total - (maxVisible - 2); i <= total; i++) list.push(i);
			return list;
		}

		list.push(1);
		list.push('...');
		list.push(current - 1);
		list.push(current);
		list.push(current + 1);
		list.push('...');
		list.push(total);
		return list;
	});

	const rangeStart = $derived(totalItems === 0 ? 0 : (page - 1) * pageSize + 1);
	const rangeEnd = $derived(Math.min(page * pageSize, totalItems));

	$effect(() => {
		if (page > totalPages) page = 1;
	});
</script>

<div class="pagination-bar d-flex align-items-center justify-content-between gap-2">
	<span class="small text-muted">
		Menampilkan {rangeStart}–{rangeEnd} dari {totalItems} data
	</span>

	<nav aria-label="Pagination">
		<ul class="pagination pagination-sm mb-0">
			<li class="page-item" class:disabled={page === 1}>
				<button class="page-link" onclick={() => (page = 1)} disabled={page === 1} aria-label="Halaman pertama">
					«
				</button>
			</li>
			<li class="page-item" class:disabled={page === 1}>
				<button
					class="page-link"
					onclick={() => (page = Math.max(1, page - 1))}
					disabled={page === 1}
					aria-label="Halaman sebelumnya"
				>
					‹
				</button>
			</li>

			{#each pages as p}
				{#if typeof p !== 'number'}
					<li class="page-item disabled">
						<span class="page-link">…</span>
					</li>
				{:else}
					<li class="page-item" class:active={p === page}>
						<button class="page-link" onclick={() => (page = p)}>{p}</button>
					</li>
				{/if}
			{/each}

			<li class="page-item" class:disabled={page === totalPages}>
				<button
					class="page-link"
					onclick={() => (page = Math.min(totalPages, page + 1))}
					disabled={page === totalPages}
					aria-label="Halaman berikutnya"
				>
					›
				</button>
			</li>
			<li class="page-item" class:disabled={page === totalPages}>
				<button
					class="page-link"
					onclick={() => (page = totalPages)}
					disabled={page === totalPages}
					aria-label="Halaman terakhir"
				>
					»
				</button>
			</li>
		</ul>
	</nav>
</div>

<style>
	.page-link {
		border: none !important;
	}
</style>
