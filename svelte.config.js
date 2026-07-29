import adapter from '@sveltejs/adapter-static';

// diserve dari subfolder Laravel nanti (mis. KIOSK_BASE=/kiosk-absensi saat build)
const base = process.env.KIOSK_BASE ?? '';

/** @type {import('@sveltejs/kit').Config} */
export default {
	kit: {
		// SPA: Web Serial + IndexedDB hanya ada di browser, jadi tidak ada SSR
		adapter: adapter({ fallback: 'index.html' }),
		paths: { base },
		files: { lib: 'src/lib' }
	}
};
