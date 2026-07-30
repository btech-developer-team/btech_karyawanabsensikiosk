/// <reference types="@sveltejs/kit" />
import { build, files, version } from '$service-worker';

/* Service worker kiosk absensi: halaman + asetnya harus tetap jalan tanpa internet. */
const CACHE = `kiosk-absensi-${version}`;
// video dipisah dari cache aset supaya naik versi CACHE tidak memaksa unduh ulang
const MEDIA_CACHE = 'kiosk-media-v1';
const NAVIGATION_TIMEOUT = 3000;

const ASSETS = [...build, ...files];

// data pegawai & sync selalu ke server; offline-nya sudah ditangani IndexedDB di halaman
const NETWORK_ONLY_PREFIXES = ['/api/kiosk'];

self.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(CACHE)
			.then((cache) => cache.addAll(ASSETS))
			.catch((error) => console.warn('precache aset kiosk gagal:', error))
			.then(() => self.skipWaiting())
	);
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) =>
				Promise.all(
					keys
						.filter((key) => key !== CACHE && key !== MEDIA_CACHE)
						.map((key) => caches.delete(key))
				)
			)
			.then(() => self.clients.claim())
	);
});

function isNetworkOnly(url) {
	return NETWORK_ONLY_PREFIXES.some((prefix) => url.pathname.startsWith(prefix));
}

async function cachePut(cacheName, request, response) {
	if (!response || !(response.ok || response.type === 'opaque')) return;
	const cache = await caches.open(cacheName);
	await cache.put(request, response);
}

/** Halaman: jaringan dulu (dengan timeout), fallback cache / shell. */
async function handleNavigate(request) {
	const cache = await caches.open(CACHE);
	const network = fetch(request)
		.then((response) => {
			if (response.ok) cachePut(CACHE, request, response.clone());
			return response;
		})
		.catch(() => null);

	const timeout = new Promise((resolve) => setTimeout(() => resolve(null), NAVIGATION_TIMEOUT));
	const fresh = await Promise.race([network, timeout]);
	if (fresh) return fresh;

	const cached =
		(await cache.match(request, { ignoreSearch: true })) ||
		(await cache.match('/')) ||
		(await cache.match('/index.html'));
	if (cached) return cached;

	const fallback = await network;
	if (fallback) return fallback;

	return new Response('<h1>Offline</h1><p>Halaman kiosk belum pernah dibuka saat online.</p>', {
		status: 503,
		headers: { 'Content-Type': 'text/html; charset=utf-8' }
	});
}

function isMedia(request, url) {
	return (
		request.destination === 'video' ||
		request.destination === 'audio' ||
		/\.(mp4|webm|ogv|ogg|mp3|m4a)$/i.test(url.pathname)
	);
}

/** Video harus diunduh utuh: fetch tanpa Range supaya 200, bukan 206. */
async function precacheMedia(url) {
	const cache = await caches.open(MEDIA_CACHE);
	if (await cache.match(url)) return;

	const sameOrigin = new URL(url).origin === self.location.origin;
	const request = sameOrigin
		? new Request(url, { cache: 'reload' })
		: new Request(url, { mode: 'no-cors', credentials: 'omit', cache: 'reload' });

	try {
		const response = await fetch(request);
		if (response.status === 200 || response.type === 'opaque') {
			await cache.put(url, response);
		}
	} catch (error) {
		console.warn('precache media gagal:', url, error);
	}
}

function parseRange(header, size) {
	const match = /^bytes=(\d*)-(\d*)$/.exec((header || '').trim());
	if (!match || (!match[1] && !match[2])) return null;
	const start = match[1] ? parseInt(match[1], 10) : Math.max(size - parseInt(match[2], 10), 0);
	const end = match[1] && match[2] ? Math.min(parseInt(match[2], 10), size - 1) : size - 1;
	if (start > end || start >= size) return null;
	return { start, end };
}

async function handleMedia(request) {
	const cache = await caches.open(MEDIA_CACHE);
	const cached = await cache.match(request.url);
	if (!cached) return fetch(request).catch(() => Response.error());

	const rangeHeader = request.headers.get('range');
	// opaque (lintas-origin tanpa CORS) tidak bisa dipotong — kirim utuh
	if (!rangeHeader || cached.type === 'opaque') return cached;

	const bytes = await cached.clone().arrayBuffer();
	const range = parseRange(rangeHeader, bytes.byteLength);
	if (!range) {
		return new Response(null, {
			status: 416,
			headers: { 'Content-Range': `bytes */${bytes.byteLength}` }
		});
	}

	const slice = bytes.slice(range.start, range.end + 1);
	return new Response(slice, {
		status: 206,
		statusText: 'Partial Content',
		headers: {
			'Content-Type': cached.headers.get('Content-Type') || 'video/mp4',
			'Content-Length': String(slice.byteLength),
			'Content-Range': `bytes ${range.start}-${range.end}/${bytes.byteLength}`,
			'Accept-Ranges': 'bytes'
		}
	});
}

/** Aset: cache-first, perbarui di belakang. */
async function handleAsset(request) {
	const cache = await caches.open(CACHE);
	const cached = await cache.match(request);
	const network = fetch(request)
		.then((response) => {
			cachePut(CACHE, request, response.clone());
			return response;
		})
		.catch(() => null);

	if (cached) return cached;
	const fresh = await network;
	if (fresh) return fresh;
	return Response.error();
}

self.addEventListener('fetch', (event) => {
	const request = event.request;
	if (request.method !== 'GET') return;

	const url = new URL(request.url);
	if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
	if (isNetworkOnly(url)) return;

	if (request.mode === 'navigate') {
		event.respondWith(handleNavigate(request));
		return;
	}

	if (isMedia(request, url)) {
		event.respondWith(handleMedia(request));
		return;
	}

	// hanya cache same-origin assets (build/files)
	if (url.origin === self.location.origin) {
		event.respondWith(handleAsset(request));
	}
});

// halaman mengirim URL video yang dipakainya
self.addEventListener('message', (event) => {
	const data = event.data;
	if (!data || data.type !== 'cache-media' || !Array.isArray(data.urls)) return;
	event.waitUntil(Promise.all(data.urls.map(precacheMedia)));
});
