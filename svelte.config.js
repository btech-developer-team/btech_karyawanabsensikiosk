import adapter from '@sveltejs/adapter-node';

// diserve dari subfolder nanti (mis. KIOSK_BASE=/kiosk-absensi saat build)
const base = process.env.KIOSK_BASE ?? '';

/** @type {import('@sveltejs/kit').Config} */
export default {
	kit: {
		adapter: adapter(),
		paths: { base },
		files: { lib: 'src/lib' }
	}
};
