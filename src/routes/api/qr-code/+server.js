import { json } from '@sveltejs/kit';
import { BACKEND, backendFetch } from '$lib/server/backend.js';

/** GET /api/qr-code */
export async function GET() {
	const { ok, status, data } = await backendFetch(BACKEND.qrCode);
	if (!ok) {
		return json(
			{ message: `Gagal ambil QR code dari backend (${status})`, data },
			{ status: status >= 400 ? status : 502 }
		);
	}
	return json(data);
}
