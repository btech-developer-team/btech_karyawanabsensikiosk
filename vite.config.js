import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';

// dev: request /api diteruskan ke Laravel supaya tetap same-origin (tanpa CORS)
const laravelOrigin =
	process.env.LARAVEL_ORIGIN ?? process.env.API_URL ?? process.env.VITE_API_URL ?? 'http://127.0.0.1:8000';

export default {
	plugins: [
		sveltekit(),
		SvelteKitPWA({
			registerType: 'autoUpdate',
			manifest: {
				name: 'B Erl Kiosk Absensi',
				short_name: 'Kiosk Absensi',
				description: 'Kiosk absensi B Erl. Tetap bisa dipakai tanpa koneksi internet.',
				lang: 'id',
				display: 'standalone',
				orientation: 'landscape',
				background_color: '#ffffff',
				theme_color: '#C0B283',
				icons: [
					{ src: 'pwa-icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
					{ src: 'pwa-icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
					{ src: 'pwa-icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
				]
			},
			workbox: {
				globPatterns: ['client/**/*.{js,css,html,ico,png,svg,webp,woff,woff2}'],
				// video kiosk besar: jangan ikut precache, cukup runtime cache di bawah
				maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
				runtimeCaching: [
					{
						// rangeRequests wajib: elemen <video> minta 206, bukan 200
						urlPattern: ({ request, url }) =>
							request.destination === 'video' || /\.(mp4|webm|ogv)$/i.test(url.pathname),
						handler: 'CacheFirst',
						options: {
							cacheName: 'kiosk-media',
							rangeRequests: true,
							cacheableResponse: { statuses: [0, 200] },
							expiration: { maxEntries: 4 }
						}
					},
					{
						// data karyawan: pakai jaringan dulu, cache jadi cadangan saat offline
						urlPattern: ({ url }) => url.pathname.startsWith('/api/kiosk-absensi/karyawan'),
						handler: 'NetworkFirst',
						options: {
							cacheName: 'kiosk-karyawan',
							networkTimeoutSeconds: 5,
							cacheableResponse: { statuses: [200] }
						}
					},
					{
						// sync absensi tidak boleh dilayani dari cache
						urlPattern: ({ url }) => url.pathname.startsWith('/api/kiosk-absensi/sync'),
						handler: 'NetworkOnly'
					}
				]
			},
			devOptions: { enabled: false }
		})
	],
	server: {
		proxy: {
			'/api': { target: laravelOrigin, changeOrigin: true }
		}
	}
};
