import { sveltekit } from '@sveltejs/kit/vite';

export default {
	plugins: [sveltekit()],
	css: {
		preprocessorOptions: {
			scss: {
				// legacy: supaya $primary di bootstrap.scss ikut ke !default Bootstrap
				api: 'legacy',
				silenceDeprecations: ['legacy-js-api', 'import', 'global-builtin', 'color-functions']
			}
		}
	}
};
