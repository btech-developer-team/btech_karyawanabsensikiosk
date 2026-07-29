import { API } from "./config.js";
import { allAbsensi, replaceKaryawan, upsertAbsensi } from "./db.js";
import { onlyNotSynced } from "./absensi.js";

const SYNC_BATCH = 500;

export async function fetchKaryawan() {
  const response = await fetch(API.karyawan);
  if (!response.ok)
    throw new Error(`Gagal memuat karyawan (${response.status})`);

  const rows = await response.json();
  await replaceKaryawan(
    rows.map((item) => ({
      id: String(item.nip),
      nama: item.nama,
      devisi: item.devisi,
      jabatan: item.jabatan,
      shift_masuk: item.shift_masuk,
      shift_keluar: item.shift_keluar,
      avatar: item.avatar
    }))
  );
}

/**
 * Kirim absensi yang belum ter-sync. Server membalas seluruh absensi hari ini,
 * dan balasan itu yang jadi sumber kebenaran untuk cache lokal.
 * @returns {Promise<{sent: number, synced?: number}>}
 */
export async function syncAbsensi() {
  const pending = (await allAbsensi())
    .filter(onlyNotSynced)
    .slice(0, SYNC_BATCH);
  console.log(pending);
  if (!pending.length) {
    getSyncAbsensi();
    return { sent: 0 };
  }

  const response = await fetch(API.sync, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ absensi: pending })
  });
  console.log(response);
  if (!response.ok) throw new Error(`Sync gagal (${response.status})`);

  const result = await response.json();
  if (result?.status === true && Array.isArray(result.data)) {
    // yang dibalas server sudah tersimpan di sana; upsertAbsensi yang menandai ter-sync
    await upsertAbsensi(
      result.data.map((row) => ({
        code: String(row.code ?? ""),
        tgl_shift: String(row.tgl_shift ?? "").split(" ")[0],
        nama_lengkap: row.nama_lengkap ?? row.pegawai_nama ?? null,
        avatar: row.avatar ?? null,
        scan_in: row.scan_in ?? null,
        scan_out: row.scan_out ?? null,
        status: row.status ?? null
      }))
    );
  }
  return { sent: pending.length, synced: result?.synced };
}

export async function getSyncAbsensi() {
  const response = await fetch(API.sync, {
    method: "GET",
    headers: { "Content-Type": "application/json", Accept: "application/json" }
  });
  if (!response.ok) throw new Error(`Sync gagal (${response.status})`);

  const result = await response.json();
  if (result?.status === true && Array.isArray(result.data)) {
    // yang dibalas server sudah tersimpan di sana; upsertAbsensi yang menandai ter-sync
    await upsertAbsensi(
      result.data.map((row) => ({
        code: String(row.code ?? ""),
        tgl_shift: String(row.tgl_shift ?? "").split(" ")[0],
        nama_lengkap: row.nama_lengkap ?? row.pegawai_nama ?? null,
        avatar: row.avatar ?? null,
        scan_in: row.scan_in ?? null,
        scan_out: row.scan_out ?? null,
        status: row.status ?? null
      }))
    );
  }
  return result;
}
