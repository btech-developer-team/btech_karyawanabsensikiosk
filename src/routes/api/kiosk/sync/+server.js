import { json } from '@sveltejs/kit';
import { BACKEND, backendFetch } from '$lib/server/backend.js';

/** GET /api/kiosk/sync — ambil absensi hari ini dari Laravel */
export async function GET() {
	try {
		const { ok, status, data } = await backendFetch(BACKEND.sync);
		if (!ok) {
			return json(
				{ status: false, message: `Upstream gagal (${status})`, data },
				{ status }
			);
		}
		return json(data, { status });
	} catch (error) {
		console.error('GET /api/kiosk/sync:', error);
		return json(
			{ status: false, message: error.message ?? 'Gagal menghubungi backend' },
			{ status: 502 }
		);
	}
}

/** POST /api/kiosk/sync — kirim absensi pending ke Laravel */
export async function POST({ request }) {
	try {
		const body = await request.text();
		const { ok, status, data } = await backendFetch(BACKEND.sync, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body
		});
		if (!ok) {
			return json(
				{ status: false, message: `Upstream gagal (${status})`, data },
				{ status }
			);
		}
		return json(data, { status });
	} catch (error) {
		console.error('POST /api/kiosk/sync:', error);
		return json(
			{ status: false, message: error.message ?? 'Gagal menghubungi backend' },
			{ status: 502 }
		);
	}
}
