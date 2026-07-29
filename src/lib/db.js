import { openDB } from 'idb';

const DB_NAME = 'kiosk-absensi';
const DB_VERSION = 1;

let dbPromise = null;

function db() {
	if (!dbPromise) {
		dbPromise = openDB(DB_NAME, DB_VERSION, {
			upgrade(database) {
				if (!database.objectStoreNames.contains('karyawan')) {
					database.createObjectStore('karyawan', { keyPath: 'id' });
				}
				if (!database.objectStoreNames.contains('absensi')) {
					// key alami code+tanggal: upsert jadi sepele dan tidak bisa dobel per hari
					database.createObjectStore('absensi', { keyPath: ['code', 'tgl_shift'] });
				}
			}
		});
	}
	return dbPromise;
}

export async function allKaryawan() {
	return (await db()).getAll('karyawan');
}

export async function findKaryawan(id) {
	return (await db()).get('karyawan', String(id));
}

export async function replaceKaryawan(rows) {
	const database = await db();
	const tx = database.transaction('karyawan', 'readwrite');
	await tx.store.clear();
	for (const row of rows) await tx.store.put(row);
	await tx.done;
}

export async function allAbsensi() {
	return (await db()).getAll('absensi');
}

export async function findAbsensi(code, tglShift) {
	return (await db()).get('absensi', [String(code), String(tglShift)]);
}

export async function putAbsensi(row) {
	return (await db()).put('absensi', row);
}

/**
 * Gabungkan balasan server ke data lokal. Tidak boleh clear-lalu-insert: scan yang
 * terjadi saat request berjalan belum diketahui server dan akan hilang.
 */
export async function upsertAbsensi(rows) {
	const database = await db();
	const tx = database.transaction('absensi', 'readwrite');
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
