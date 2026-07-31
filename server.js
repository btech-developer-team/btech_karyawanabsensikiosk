/**
 * Entry production untuk Niagahoster / Node hosting.
 * `node build` TIDAK membaca .env — file ini yang load env dulu, baru start adapter-node.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function loadEnvFile(filename = '.env') {
	const path = resolve(process.cwd(), filename);
	if (!existsSync(path)) return;

	for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) continue;

		const eq = trimmed.indexOf('=');
		if (eq === -1) continue;

		const key = trimmed.slice(0, eq).trim();
		let value = trimmed.slice(eq + 1).trim();
		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1);
		}

		// jangan timpa env yang sudah di-set panel hosting
		if (!(key in process.env)) process.env[key] = value;
	}
}

loadEnvFile('.env');
loadEnvFile('.env.production');

// HAPUS ATAU JANGAN SET process.env.HOST SAMA SEKALI
if (process.env.HOST) delete process.env.HOST; 

// Biarkan adapter-node berjalan otomatis menggunakan port dinamis dari cPanel
await import('./build/index.js');
