<script>
	/**
	 * Dropdown jumlah item per halaman.
	 * @param {number} value - page size (bindable)
	 * @param {number[]} options
	 */
	let {
		value = $bindable(10),
		options = [5, 10, 20, 50, 100],
		onchange = undefined
	} = $props();

	function onSelect(event) {
		value = Number(event.currentTarget.value);
		onchange?.();
	}
</script>

<select class="form-select form-select-sm page-size-select" value={value} onchange={onSelect}>
	{#each options as option}
		<option value={option}>{option}</option>
	{/each}
</select>

<style>
	.page-size-select {
		width: auto;
		min-width: 4.5rem;
	}
</style>
