import { env } from '$env/dynamic/private';
import { error } from '@sveltejs/kit';

/** Origin Laravel (server-only). */
export function backendOrigin() {
	const raw = (env.API_URL || env.LARAVEL_ORIGIN || 'http://127.0.0.1:8000').trim();
	const withProtocol = /^https?:\/\//i.test(raw) ? raw : `http://${raw}`;
	return withProtocol.replace(/\/+$/, '');
}

export const BACKEND = {
	karyawan: '/api/v1/pegawai/data',
	sync: '/api/v1/kiosk-absensi/sync'
};

/**
 * Fetch ke Laravel dari SvelteKit server.
 * @param {string} path
 * @param {RequestInit} [init]
 */
export async function backendFetch(path, init = {}) {
	const url = `${backendOrigin()}${path}`;
	const headers = new Headers(init.headers ?? {});
	if (!headers.has('Accept')) headers.set('Accept', 'application/json');

	let response;
	try {
		response = await fetch(url, { ...init, headers });
	} catch (err) {
		console.error('backendFetch network error:', url, err);
		throw error(502, `Tidak bisa menghubungi backend (${backendOrigin()})`);
	}

	const text = await response.text();
	let data = null;
	try {
		data = text ? JSON.parse(text) : null;
	} catch {
		data = text;
	}

	return { response, data, status: response.status, ok: response.ok };
}
