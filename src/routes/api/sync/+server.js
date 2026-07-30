import { json } from '@sveltejs/kit';
import { BACKEND, backendFetch } from '$lib/server/backend.js';

/** GET /api/sync */
export async function GET() {
	const { ok, status, data } = await backendFetch(BACKEND.sync);
	if (!ok) {
		return json(
			{ status: false, message: `Gagal ambil sync dari backend (${status})`, data },
			{ status: status >= 400 ? status : 502 }
		);
	}
	return json(data);
}

/** POST /api/sync */
export async function POST({ request }) {
	const body = await request.text();
	const { ok, status, data } = await backendFetch(BACKEND.sync, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body
	});
	if (!ok) {
		return json(
			{ status: false, message: `Gagal kirim sync ke backend (${status})`, data },
			{ status: status >= 400 ? status : 502 }
		);
	}
	return json(data);
}
