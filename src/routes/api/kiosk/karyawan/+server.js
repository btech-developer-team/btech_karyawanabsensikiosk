import { json } from '@sveltejs/kit';
import { BACKEND, backendFetch } from '$lib/server/backend.js';

/** GET /api/kiosk/karyawan — ambil data pegawai dari Laravel */
export async function GET() {
	try {
		const { ok, status, data } = await backendFetch(BACKEND.karyawan);
		if (!ok) {
			return json(
				{ status: false, message: `Upstream gagal (${status})`, data },
				{ status }
			);
		}
		return json(data, { status });
	} catch (error) {
		console.error('GET /api/kiosk/karyawan:', error);
		return json(
			{ status: false, message: error.message ?? 'Gagal menghubungi backend' },
			{ status: 502 }
		);
	}
}
