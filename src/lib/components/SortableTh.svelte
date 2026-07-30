<script>
	/**
	 * Header kolom yang bisa di-sort.
	 * @param {string} label
	 * @param {string} columnKey - key field untuk sort
	 * @param {string} sortKey - key yang sedang aktif (bindable)
	 * @param {'asc'|'desc'} sortDir - arah sort (bindable)
	 */
	let {
		label,
		columnKey,
		sortKey = $bindable(''),
		sortDir = $bindable('asc'),
		onclick = undefined
	} = $props();

	function toggle() {
		if (sortKey === columnKey) {
			sortDir = sortDir === 'asc' ? 'desc' : 'asc';
		} else {
			sortKey = columnKey;
			sortDir = 'asc';
		}
		onclick?.();
	}

	const active = $derived(sortKey === columnKey);
</script>

<th class="sortable" onclick={toggle}>
	{label}
	{#if active}
		<span class="sort-icon">{sortDir === 'asc' ? '↑' : '↓'}</span>
	{:else}
		<span class="sort-icon muted">↕</span>
	{/if}
</th>

<style>
	.sortable {
		cursor: pointer;
		user-select: none;
		white-space: nowrap;
	}

	.sortable:hover {
		background-color: #e9ecef;
	}

	.sort-icon {
		font-size: 0.75rem;
		margin-left: 4px;
	}

	.sort-icon.muted {
		opacity: 0.35;
	}
</style>
