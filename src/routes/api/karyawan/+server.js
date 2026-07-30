import { json } from '@sveltejs/kit';
import { BACKEND, backendFetch } from '$lib/server/backend.js';

/** GET /api/karyawan */
export async function GET() {
	const { ok, status, data } = await backendFetch(BACKEND.karyawan);
	if (!ok) {
		return json(
			{ message: `Gagal ambil karyawan dari backend (${status})`, data },
			{ status: status >= 400 ? status : 502 }
		);
	}
	// normalisasi: Laravel kadang kirim array, kadang { data: [] }
	const rows = Array.isArray(data) ? data : (data?.data ?? data);
	return json(rows);
}
