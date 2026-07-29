// Self-check logika absensi. Jalankan: npm test
import assert from 'node:assert/strict';
import { decideAbsensi, MIN_SCAN_GAP_SECONDS, onlyNotSynced } from '../src/lib/absensi.js';
import { timeToSeconds } from '../src/lib/time.js';

const karyawan = {
	id: '1001',
	nama: 'Budi',
	avatar: null,
	shift_masuk: '08:00:00',
	shift_keluar: '17:00:00'
};
const isoDate = '2026-07-29';
const scan = (currentTime, existing = null) =>
	decideAbsensi({ existing, karyawan, currentTime, isoDate });

// scan masuk sebelum/tepat jam shift
{
	const { status, record } = scan('07:45:00');
	assert.equal(status, 'in');
	assert.equal(record.status, 'Masuk');
	assert.equal(record.scan_in, '07:45:00');
	assert.equal(record.isInSynced, false);
	assert.deepEqual([record.code, record.tgl_shift], ['1001', isoDate]);
}
assert.equal(scan('08:00:00').record.status, 'Masuk', 'tepat jam masuk belum telat');

// setelah jam masuk = telat
assert.equal(scan('08:00:01').record.status, 'Telat');

// lewat jam pulang tanpa pernah scan masuk: tidak dicatat
assert.equal(scan('17:00:00').status, 'outside-shift');

// scan dobel tak sengaja tidak boleh langsung jadi pulang
{
	const masuk = scan('08:10:00').record;
	assert.equal(scan('08:10:30', masuk).status, 'too-soon');
	const gap = `08:${String(10 + Math.ceil(MIN_SCAN_GAP_SECONDS / 60)).padStart(2, '0')}:31`;
	const keluar = scan(gap, masuk);
	assert.equal(keluar.status, 'out');
	assert.equal(keluar.record.status, 'Pulang Awal', 'sebelum jam shift selesai = pulang awal');
	assert.equal(keluar.record.scan_in, '08:10:00', 'scan masuk tidak boleh tertimpa');
}
assert.equal(scan('17:30:00', { scan_in: '08:00:00' }).record.status, 'Keluar');

// sudah lengkap: scan berikutnya tidak mengubah apa pun
assert.equal(scan('18:00:00', { scan_in: '08:00:00', scan_out: '17:05:00' }).status, 'done');

// shift belum ada jadwalnya
assert.equal(
	decideAbsensi({ existing: null, karyawan: { ...karyawan, shift_masuk: null }, currentTime: '08:00:00', isoDate })
		.status,
	'invalid-shift'
);

// parsing waktu
assert.equal(timeToSeconds('01:02:03'), 3723);
assert.equal(timeToSeconds('08:30'), 30600);
assert.equal(timeToSeconds('-'), null);
assert.equal(timeToSeconds('abc'), null);

// filter kandidat sync
assert.equal(onlyNotSynced({ scan_in: '08:00:00', isInSynced: false }), true);
assert.equal(onlyNotSynced({ scan_in: '08:00:00', isInSynced: true }), false);
assert.equal(onlyNotSynced({ scan_in: '08:00:00', isInSynced: true, scan_out: '17:00:00' }), true);

console.log('OK: logika absensi lolos semua pemeriksaan');
