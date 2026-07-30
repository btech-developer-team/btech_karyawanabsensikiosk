<script>
  import { DEFAULT_AVATAR } from "$lib/config.js";
  import { formatDate } from "$lib/time.js";
  import PageSizeSelect from "./PageSizeSelect.svelte";
  import Pagination from "./Pagination.svelte";
  import SortableTh from "./SortableTh.svelte";

  let { rows = [], loading = false, firstLoad = true } = $props();

  let search = $state("");
  let sortKey = $state("scan_in");
  let sortDir = $state("desc");
  let page = $state(1);
  let pageSize = $state(10);

  const COLUMNS = [
    { key: "nama_lengkap", label: "Nama" },
    { key: "tgl_shift", label: "Tanggal" },
    { key: "scan_in", label: "Check-In" },
    { key: "scan_out", label: "Check-Out" },
    { key: "status", label: "Status" }
  ];

  function compare(a, b) {
    const va = String(a[sortKey] ?? "");
    const vb = String(b[sortKey] ?? "");
    return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
  }

  const filtered = $derived.by(() => {
    const term = search.trim().toLowerCase();
    return term
      ? rows.filter((row) =>
          [row.nama_lengkap, row.code, row.status, row.rfid].some((field) =>
            String(field ?? "")
              .toLowerCase()
              .includes(term)
          )
        )
      : rows;
  });

  const sorted = $derived([...filtered].sort(compare));

  const paginated = $derived(
    sorted.slice((page - 1) * pageSize, page * pageSize)
  );

  $effect(() => {
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
      <PageSizeSelect bind:value={pageSize} onchange={() => (page = 1)} />
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
            <SortableTh
              label={col.label}
              columnKey={col.key}
              bind:sortKey
              bind:sortDir
              onclick={() => (page = 1)}
            />
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each paginated as row, i (row.code + row.tgl_shift)}
          <tr>
            <td>{(page - 1) * pageSize + i + 1}</td>
            <td>
              <img
                class="avatar"
                src={row.avatar || DEFAULT_AVATAR}
                alt={row.nama_lengkap ?? row.code}
              />
            </td>
            <td>{row.code} - {row.nama_lengkap}</td>
            <td>{formatDate(row.tgl_shift)}</td>
            <td>{row.scan_in ?? "-"}</td>
            <td>{row.scan_out ?? "-"}</td>
            <td>
              <span class="badge {statusBadge(row.status)}"
                >{row.status ?? "-"}</span
              >
            </td>
          </tr>
        {:else}
          {#if firstLoad}
            <!-- INSERT_YOUR_CODE -->
            {#each Array(10) as _, j}
              <tr>
                <td class="text-center">
                  <span class="placeholder-glow">
                    <span class="placeholder rounded col-6"></span>
                  </span>
                </td>
                <td class="text-center">
                  <span class="placeholder-glow">
                    <span
                      class="placeholder rounded-circle"
                      style="width: 40px; height: 40px; display: inline-block;"
                    ></span>
                  </span>
                </td>
                <td>
                  <span class="placeholder-glow">
                    <span class="placeholder rounded col-12"></span>
                  </span>
                </td>
                <td>
                  <span class="placeholder-glow">
                    <span class="placeholder rounded col-12"></span>
                  </span>
                </td>
                <td>
                  <span class="placeholder-glow">
                    <span class="placeholder rounded col-12"></span>
                  </span>
                </td>
                <td>
                  <span class="placeholder-glow">
                    <span class="placeholder rounded col-12"></span>
                  </span>
                </td>
                <td>
                  <span class="placeholder-glow">
                    <span class="placeholder rounded col-12"></span>
                  </span>
                </td>
              </tr>
            {/each}
          {:else if loading}
            <tr>
              <td colspan="7" class="text-center text-muted py-4">
                <span class="spinner-border spinner-border-sm me-2"></span> Memuat
                data...
              </td>
            </tr>
          {:else}
            <tr>
              <td colspan="7" class="text-center text-muted py-4">
                Belum ada data absensi.
              </td>
            </tr>
          {/if}
        {/each}
      </tbody>
    </table>
  </div>

  <div class="card-footer py-2">
    <Pagination bind:page totalItems={filtered.length} {pageSize} />
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
</style>
