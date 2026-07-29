import { findAbsensi, findKaryawan, putAbsensi } from './db.js';
import { nowParts, timeToSeconds } from './time.js';

/**
 * Jeda minimum antara scan masuk dan scan keluar. RFID/QR gampang terbaca dua kali,
 * dan tanpa jeda ini scan dobel langsung tercatat sebagai pulang.
 */
export const MIN_SCAN_GAP_SECONDS = 60;

/**
 * Keputusan absensi dari satu scan. Pure supaya bisa diuji tanpa browser/IndexedDB.
 *
 * @param {{existing?: object|null, karyawan: object, currentTime: string, isoDate: string}} input
 * @returns {{status: 'in'|'out'|'invalid-shift'|'outside-shift'|'before-checkout'|'too-soon'|'done', record?: object}}
 */
export function decideAbsensi({ existing, karyawan, currentTime, isoDate }) {
	const nowSec = timeToSeconds(currentTime);
	const masukSec = timeToSeconds(karyawan.shift_masuk);
	const keluarSec = timeToSeconds(karyawan.shift_keluar);

	console.log(nowSec, masukSec, keluarSec);
	if (nowSec == null || masukSec == null || keluarSec == null) return { status: 'invalid-shift' };

	const record = {
		...(existing || {}),
		code: String(karyawan.id),
		tgl_shift: isoDate,
		nama_lengkap: karyawan.nama,
		avatar: karyawan.avatar ?? null
	};

	if (!record.scan_in) {
		// sudah lewat jam pulang tapi belum pernah scan masuk: bukan absen masuk
		if (nowSec >= keluarSec) throw new Error('Scan di luar jam shift hari ini.');
		record.scan_in = currentTime;
		record.status = nowSec <= masukSec ? 'Masuk' : 'Telat';
		record.isInSynced = false;
		return { status: 'in', record };
	}

	if (!record.scan_out) {
		const inSec = timeToSeconds(record.scan_in);
		if (inSec != null && nowSec - inSec < MIN_SCAN_GAP_SECONDS) throw new Error('Baru saja scan masuk. Coba lagi beberapa saat.');
		// Scan kedua sebelum jam pulang tidak boleh menyimpan perubahan apa pun.
		if (nowSec < keluarSec) return { status: 'before-checkout' };
		record.scan_out = currentTime;
		record.status = 'Keluar';
		record.isOutSynced = false;
		return { status: 'out', record };
	}

	return { status: 'done' };
}

const MESSAGES = {
	'invalid-shift': 'Jadwal shift karyawan belum tersedia.',
	'outside-shift': 'Scan di luar jam shift hari ini.',
	'before-checkout': 'Belum jam pulang. Scan keluar belum bisa diproses.',
	'too-soon': 'Baru saja scan masuk. Coba lagi beberapa saat.',
	done: 'Sudah scan masuk dan keluar hari ini.'
};

/** Absensi yang perlu dikirim ke server: ada scan yang belum ter-sync. */
export function onlyNotSynced(absensi) {
	if (absensi.scan_in && !absensi.isInSynced) return true;
	if (absensi.scan_out && !absensi.isOutSynced) return true;
	return false;
}

let processing = false;

/**
 * Proses satu hasil scan (QR/RFID/keyboard) terhadap data lokal.
 * @returns {Promise<{type: 'success'|'error'|'ignored', message: string, user?: object}>}
 */
export async function processScan(raw) {
	const identifier = String(raw ?? '').trim();
	if (!identifier) return { type: 'error', message: 'Kode scan kosong.' };
	if (processing) return { type: 'ignored', message: 'Scan sebelumnya masih diproses.' };

	processing = true;
	try {
		const { isoDate, time } = nowParts();
		const karyawan = await findKaryawan(identifier);
		if (!karyawan) {
			return { type: 'error', message: 'Kode karyawan tidak ditemukan.', user: { nama: identifier } };
		}

		const existing = await findAbsensi(identifier, isoDate);
		const { status, record } = decideAbsensi({ existing, karyawan, currentTime: time, isoDate });
		if (!record) {
			return { type: 'error', message: MESSAGES[status] ?? 'Scan tidak dapat diproses.', user: karyawan };
		}

		await putAbsensi(record);
		return {
			type: 'success',
			message: status === 'out' ? `Scan keluar ${record.scan_out}` : `Scan masuk ${record.scan_in}`,
			user: karyawan
		};
	} catch (error) {
		console.warn('processScan gagal:', error);
		return { type: 'error', message: error.message ?? 'Gagal menyimpan absensi ke perangkat.' };
	} finally {
		processing = false;
	}
}
