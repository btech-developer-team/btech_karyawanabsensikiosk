import { openDB } from "idb";

const DB_NAME = "kiosk-absensi";
const DB_VERSION = 4;

let dbPromise = null;

function db() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(database, oldVersion, newVersion, transaction) {
        if (!database.objectStoreNames.contains("karyawan")) {
          const karyawanStore = database.createObjectStore("karyawan", {
            keyPath: "id"
          });
          karyawanStore.createIndex("rfid", "rfid", { unique: false });
        } else {
          const karyawanStore = transaction.objectStore("karyawan");
          if (!karyawanStore.indexNames.contains("rfid")) {
            karyawanStore.createIndex("rfid", "rfid", { unique: false });
          }
        }
        if (!database.objectStoreNames.contains("absensi")) {
          // key alami code+tanggal: upsert jadi sepele dan tidak bisa dobel per hari
          const absensiStore = database.createObjectStore("absensi", {
            keyPath: ["code", "tgl_shift"]
          });

          absensiStore.createIndex("tgl_shift", "tgl_shift");
        } else {
          // Tambah index baru jika object store "absensi" sudah ada dan upgrade dengan versi baru.
          // Di idb v5+ sudah bisa menambah index saat upgrade meski object store sudah ada.
          const absensiStore = transaction.objectStore("absensi");
          if (!absensiStore.indexNames.contains("tgl_shift")) {
            absensiStore.createIndex("tgl_shift", "tgl_shift");
          }
        }
      }
    });
  }
  return dbPromise;
}

export async function allKaryawan() {
  return (await db()).getAll("karyawan");
}

/** Cari karyawan by NIP/id dulu, lalu by RFID. */
export async function findKaryawan(identifier) {
  const key = String(identifier ?? "").trim();
  if (!key) return undefined;

  const database = await db();
  const byId = await database.get("karyawan", key);
  if (byId) return byId;

  return database.getFromIndex("karyawan", "rfid", key);
}

export async function replaceKaryawan(rows) {
  const database = await db();
  const tx = database.transaction("karyawan", "readwrite");
  await tx.store.clear();
  for (const row of rows) await tx.store.put(row);
  await tx.done;
}

export async function allAbsensi() {
  return (await db()).getAll("absensi");
}

export async function allAbsensiToday() {
  return (await db()).getAllFromIndex(
    "absensi",
    "tgl_shift",
    new Date().toISOString().split("T")[0]
  );
}

export async function findAbsensi(code, tglShift) {
  return (await db()).get("absensi", [String(code), String(tglShift)]);
}

export async function putAbsensi(row) {
  return (await db()).put("absensi", row);
}

/**
 * Gabungkan balasan server ke data lokal. Tidak boleh clear-lalu-insert: scan yang
 * terjadi saat request berjalan belum diketahui server dan akan hilang.
 */
export async function upsertAbsensi(rows) {
  const database = await db();
  const tx = database.transaction("absensi", "readwrite");
  for (const row of rows) {
    const local = await tx.store.get([row.code, row.tgl_shift]);
    await tx.store.put({
      ...local,
      ...row,
      scan_in: row.scan_in ?? local?.scan_in ?? null,
      scan_out: row.scan_out ?? local?.scan_out ?? null,
      isInSynced: row.scan_in ? true : (local?.isInSynced ?? false),
      isOutSynced: row.scan_out ? true : (local?.isOutSynced ?? false)
    });
  }
  await tx.done;
}

export async function emptyTodayAbsensi() {
  const database = await db();
  const tx = database.transaction("absensi", "readwrite");
  await tx.store.clear();
  await tx.done;
}

/**
 * Hapus absensi lama yang sudah fully synced.
 * Default: lebih dari `retentionDays` hari, dan isInSynced + isOutSynced.
 */
export async function pruneSyncedAbsensi(retentionDays = 7) {
  const database = await db();
  const all = await database.getAll("absensi");
  if (!all.length) return 0;

  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - retentionDays);
  const cutoffIso = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, "0")}-${String(cutoff.getDate()).padStart(2, "0")}`;

  const tx = database.transaction("absensi", "readwrite");
  let removed = 0;
  for (const row of all) {
    const tgl = String(row.tgl_shift ?? "").split(" ")[0];
    const fullySynced = Boolean(row.isInSynced) && Boolean(row.isOutSynced);
    if (fullySynced && tgl && tgl < cutoffIso) {
      await tx.store.delete([row.code, row.tgl_shift]);
      removed += 1;
    }
  }
  await tx.done;
  return removed;
}
