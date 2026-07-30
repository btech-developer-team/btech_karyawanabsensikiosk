/** Toast store Bootstrap 5 — ID unik supaya aman di Svelte 5. */

let seq = 0;

/** @type {Array<{id: string, title: string, body: string, type: 'error'|'success'|'warning'|'info'}>} */
let items = $state([]);

/**
 * @param {{ title?: string, body?: string, type?: 'error'|'success'|'warning'|'info', duration?: number }} opts
 */
export function addToast({ title = '', body = '', type = 'error', duration = 5000 } = {}) {
	const id = `${Date.now()}-${++seq}`;
	items = [...items, { id, title, body: String(body ?? ''), type }];
	if (duration > 0) {
		setTimeout(() => removeToast(id), duration);
	}
	return id;
}

export function removeToast(id) {
	items = items.filter((t) => t.id !== id);
}

export function getToasts() {
	return items;
}
