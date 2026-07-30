import { env } from '$env/dynamic/private';

/** Origin Laravel / backend API (tanpa trailing slash). */
export function backendOrigin() {
	const raw = (env.API_URL || env.LARAVEL_ORIGIN || 'http://127.0.0.1:8000').trim();
	const withProtocol = /^https?:\/\//i.test(raw) ? raw : `http://${raw}`;
	return withProtocol.replace(/\/+$/, '');
}

/** Path Laravel yang dipakai kiosk. */
export const BACKEND = {
	karyawan: '/api/v1/pegawai/data',
	sync: '/api/v1/kiosk-absensi/sync'
};

/**
 * Proxy request ke backend Laravel.
 * @param {string} path
 * @param {RequestInit & { body?: BodyInit | null }} [init]
 */
export async function backendFetch(path, init = {}) {
	const url = `${backendOrigin()}${path}`;
	const headers = new Headers(init.headers ?? {});
	if (!headers.has('Accept')) headers.set('Accept', 'application/json');

	const response = await fetch(url, { ...init, headers });
	const text = await response.text();
	let data = null;
	try {
		data = text ? JSON.parse(text) : null;
	} catch {
		data = text;
	}

	return { response, data, status: response.status, ok: response.ok };
}
