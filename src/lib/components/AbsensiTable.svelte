<script>
  import { DEFAULT_AVATAR } from "$lib/config.js";
  import { formatDate } from "$lib/time.js";

  let { rows = [], loading = false } = $props();

  let search = $state("");
  let sortKey = $state("scan_in");
  let sortDir = $state("desc");
  let page = $state(1);
  const pageOptions = [5, 10, 20, 50, 100];
  let PAGE_SIZE = $state(10);

  const COLUMNS = [
    { key: "nama_lengkap", label: "Nama" },
    { key: "tgl_shift", label: "Tanggal" },
    { key: "scan_in", label: "Check-In" },
    { key: "scan_out", label: "Check-Out" },
    { key: "status", label: "Status" }
  ];

  function toggleSort(key) {
    if (sortKey === key) {
      sortDir = sortDir === "asc" ? "desc" : "asc";
    } else {
      sortKey = key;
      sortDir = "asc";
    }
    page = 1;
  }

  function compare(a, b) {
    const va = String(a[sortKey] ?? "");
    const vb = String(b[sortKey] ?? "");
    return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
  }

  const filtered = $derived.by(() => {
    const term = search.trim().toLowerCase();
    return term
      ? rows.filter((row) =>
          [row.nama_lengkap, row.code, row.status].some((field) =>
            String(field ?? "")
              .toLowerCase()
              .includes(term)
          )
        )
      : rows;
  });

  const sorted = $derived([...filtered].sort(compare));

  const totalPages = $derived(
    Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  );

  const paginated = $derived(
    sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  );

  $effect(() => {
    // reset page kalau filter/sort membuat halaman aktif jadi out-of-range
    if (page > totalPages) page = 1;
  });

  $effect(() => {
    // reset ke hal 1 saat pencarian berubah
    search;
    page = 1;
  });

  function statusBadge(status) {
    if (status === "Masuk" || status === "Keluar") return "text-bg-success";
    if (status === "Telat") return "text-bg-danger";
    if (status === "Pulang Awal") return "text-bg-warning";
    return "text-bg-secondary";
  }
</script>

<div class="card card-table">
  <div
    class="card-header d-flex align-items-center justify-content-between gap-2"
  >
    <span class="fw-semibold">Tabel Absensi</span>

    <div class="d-flex align-items-center gap-2 me-2">
      <select
        name=""
        id=""
        class="form-select form-select-sm"
        bind:value={PAGE_SIZE}
      >
        {#each pageOptions as option}
          <option value={option}>{option}</option>
        {/each}
      </select>
      <input
        class="form-control form-control-sm search-input"
        type="search"
        placeholder="Cari nama / kode / status"
        bind:value={search}
      />
    </div>
  </div>

  <div class="card-body p-0 table-wrapper">
    <table class="table table-hover align-middle mb-0">
      <thead class="table-light sticky-top">
        <tr>
          <th style="width: 3rem">#</th>
          <th style="width: 4.5rem">Avatar</th>
          {#each COLUMNS as col}
            <th class="sortable" onclick={() => toggleSort(col.key)}>
              {col.label}
              {#if sortKey === col.key}
                <span class="sort-icon">{sortDir === "asc" ? "↑" : "↓"}</span>
              {:else}
                <span class="sort-icon muted">↕</span>
              {/if}
            </th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each paginated as row, i (row.code + row.tgl_shift)}
          <tr>
            <td>{(page - 1) * PAGE_SIZE + i + 1}</td>
            <td>
              <img
                class="avatar"
                src={row.avatar || DEFAULT_AVATAR}
                alt={row.nama_lengkap ?? row.code}
              />
            </td>
            <td>{row.code} -{row.nama_lengkap}</td>
            <td>{formatDate(row.tgl_shift)}</td>
            <td>{row.scan_in ?? "-"}</td>
            <td>{row.scan_out ?? "-"}</td>
            <td
              ><span class="badge {statusBadge(row.status)}"
                >{row.status ?? "-"}</span
              ></td
            >
          </tr>
        {:else}
          <tr>
            <td colspan="7" class="text-center text-muted py-4">
              {#if loading}
                <span class="spinner-border spinner-border-sm me-2"></span> Memuat
                data...
              {:else}
                Belum ada data absensi.
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <div
    class="card-footer d-flex align-items-center justify-content-between gap-2 py-2"
  >
    <span class="small text-muted">
      Menampilkan {filtered.length === 0
        ? 0
        : (page - 1) * PAGE_SIZE + 1}–{Math.min(
        page * PAGE_SIZE,
        filtered.length
      )} dari {filtered.length} data
    </span>

    <nav>
      <ul class="pagination pagination-sm mb-0">
        <li class="page-item" class:disabled={page === 1}>
          <button
            class="page-link"
            onclick={() => (page = 1)}
            disabled={page === 1}>«</button
          >
        </li>
        <li class="page-item" class:disabled={page === 1}>
          <button class="page-link" onclick={() => page--} disabled={page === 1}
            >‹</button
          >
        </li>

        {#each Array.from({ length: totalPages }, (_, i) => i + 1).filter((p) => Math.abs(p - page) <= 2) as p}
          <li class="page-item" class:active={p === page}>
            <button class="page-link" onclick={() => (page = p)}>{p}</button>
          </li>
        {/each}

        <li class="page-item" class:disabled={page === totalPages}>
          <button
            class="page-link"
            onclick={() => page++}
            disabled={page === totalPages}>›</button
          >
        </li>
        <li class="page-item" class:disabled={page === totalPages}>
          <button
            class="page-link"
            onclick={() => (page = totalPages)}
            disabled={page === totalPages}>»</button
          >
        </li>
      </ul>
    </nav>
  </div>
</div>

<style>
  .card-table {
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .table-wrapper {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
  }

  .search-input {
    max-width: 14rem;
  }

  .avatar {
    width: 40px;
    height: 40px;
    object-fit: cover;
    border-radius: 50%;
  }

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
