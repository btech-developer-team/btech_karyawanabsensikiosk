import { BAUD_RATE, USB_SLOT_COUNT } from './config.js';

const STATUS = {
	empty: 'Belum terhubung',
	granted: 'Diizinkan',
	listening: 'Listening',
	disconnecting: 'Disconnecting...',
	failed: 'Gagal open',
	lost: 'Terputus',
	error: 'Error'
};

function withTimeout(promise, ms) {
	return Promise.race([
		Promise.resolve(promise).catch(() => {}),
		new Promise((resolve) => setTimeout(resolve, ms))
	]);
}

function portLabel(port, index) {
	const info = port.getInfo ? port.getInfo() : {};
	if (info.usbVendorId != null) {
		return `USB ${info.usbVendorId.toString(16)}:${(info.usbProductId || 0).toString(16)}`;
	}
	return `Serial #${index + 1}`;
}

/**
 * Slot USB COM kiosk. Satu slot = satu perangkat scanner.
 * Port disimpan di luar state reaktif (objek SerialPort tidak untuk di-proxy Svelte).
 */
class UsbScanner {
	/** @type {Array<{name: string, status: string, busy: boolean}|null>} */
	slots = $state(new Array(USB_SLOT_COUNT).fill(null));
	supported = $state(true);

	#ports = new Array(USB_SLOT_COUNT).fill(null);
	#readers = new Array(USB_SLOT_COUNT).fill(null);
	#openPorts = new WeakSet();
	// port yang diputus manual: jangan di-auto connect lagi di sesi ini
	#manuallyClosed = new WeakSet();
	#onScan = () => {};
	#onError = () => {};

	start({ onScan, onError }) {
		this.#onScan = onScan;
		this.#onError = onError;
		this.supported = typeof navigator !== 'undefined' && 'serial' in navigator;
		if (!this.supported) return () => {};

		const refresh = () => this.refreshGrantedPorts();
		navigator.serial.addEventListener('connect', refresh);
		navigator.serial.addEventListener('disconnect', refresh);
		refresh();

		return () => {
			navigator.serial.removeEventListener('connect', refresh);
			navigator.serial.removeEventListener('disconnect', refresh);
		};
	}

	#setSlot(index, patch) {
		const current = this.slots[index];
		this.slots[index] = patch === null ? null : { ...(current || {}), ...patch };
	}

	async refreshGrantedPorts() {
		if (!this.supported) return;
		const ports = await navigator.serial.getPorts();

		this.#ports.forEach((port, i) => {
			// izin dicabut / perangkat dilepas: kosongkan slotnya
			if (port && !ports.includes(port) && !this.#openPorts.has(port)) {
				this.#ports[i] = null;
				this.#setSlot(i, null);
			}
		});

		for (const port of ports) {
			if (this.#ports.includes(port)) continue;
			const free = this.#ports.indexOf(null);
			if (free === -1) break;
			this.#ports[free] = port;
			this.#setSlot(free, {
				name: portLabel(port, free),
				status: this.#openPorts.has(port) ? STATUS.listening : STATUS.granted,
				busy: false
			});
		}

		// port yang sudah pernah diizinkan langsung dipakai lagi, kecuali diputus manual
		for (let i = 0; i < this.#ports.length; i++) {
			const port = this.#ports[i];
			if (!port || this.slots[i]?.busy) continue;
			if (this.#openPorts.has(port) || this.#manuallyClosed.has(port)) continue;
			await this.open(i, false);
		}
	}

	/** Dialog pilih perangkat; null kalau dibatalkan atau sudah dipakai slot lain. */
	async #pickPort(slotIndex) {
		if (!this.supported) {
			this.#onError('Browser tidak support Web Serial. Pakai Chrome/Edge.');
			return null;
		}
		let port;
		try {
			port = await navigator.serial.requestPort();
		} catch (error) {
			console.warn('requestPort dibatalkan/gagal:', error);
			return null;
		}
		const usedSlot = this.#ports.findIndex((p, i) => p === port && i !== slotIndex);
		if (usedSlot !== -1) {
			this.#onError(`USB COM ini sudah dipakai di USB COM ${usedSlot + 1}. Pilih perangkat lain.`);
			return null;
		}
		return port;
	}

	async connect(slotIndex) {
		if (this.#ports[slotIndex]) {
			if (this.slots[slotIndex]?.status === STATUS.listening) return this.disconnect(slotIndex);
			return this.open(slotIndex);
		}
		const port = await this.#pickPort(slotIndex);
		if (!port) return;
		this.#ports[slotIndex] = port;
		this.#setSlot(slotIndex, { name: portLabel(port, slotIndex), status: STATUS.granted, busy: false });
		await this.open(slotIndex);
	}

	async open(slotIndex, notify = true) {
		const port = this.#ports[slotIndex];
		if (!port) return;
		this.#manuallyClosed.delete(port);

		if (this.#openPorts.has(port)) {
			this.#setSlot(slotIndex, { status: STATUS.listening, busy: false });
			return;
		}

		try {
			await port.open({ baudRate: BAUD_RATE });
		} catch (error) {
			if (!String(error).includes('already open')) {
				console.warn('gagal open port:', error);
				this.#setSlot(slotIndex, { status: STATUS.failed, busy: false });
				if (notify) {
					this.#onError(
						`${this.slots[slotIndex]?.name ?? 'Port'} gagal dibuka. Kemungkinan port sedang dipakai aplikasi lain.`
					);
				}
				return;
			}
		}

		this.#openPorts.add(port);
		this.#setSlot(slotIndex, { status: STATUS.listening, busy: false });
		this.#readLoop(slotIndex);
	}

	async #readLoop(slotIndex) {
		const port = this.#ports[slotIndex];
		let buffer = '';
		try {
			// stop segera kalau disconnect — jangan re-getReader (itu yang bikin hang)
			while (port.readable && !this.slots[slotIndex]?.busy) {
				const reader = port.readable.getReader();
				this.#readers[slotIndex] = reader;
				try {
					while (!this.slots[slotIndex]?.busy) {
						const { value, done } = await reader.read();
						if (done || this.slots[slotIndex]?.busy) break;
						buffer += new TextDecoder().decode(value);
						let nl;
						while ((nl = buffer.search(/[\r\n]/)) !== -1) {
							const line = buffer.slice(0, nl).trim();
							buffer = buffer.slice(nl).replace(/^[\r\n]+/, '');
							if (line) this.#onScan(line, slotIndex);
						}
					}
				} finally {
					try {
						reader.releaseLock();
					} catch {
						/* reader sudah dilepas */
					}
					if (this.#readers[slotIndex] === reader) this.#readers[slotIndex] = null;
				}
			}
		} catch (error) {
			if (!this.slots[slotIndex]?.busy) console.warn('serial read error:', error);
		} finally {
			// loop berhenti tanpa disconnect manual = perangkat dicabut
			if (!this.slots[slotIndex]?.busy && this.#ports[slotIndex] === port) {
				this.#openPorts.delete(port);
				this.#setSlot(slotIndex, { status: STATUS.lost, busy: false });
			}
		}
	}

	async disconnect(slotIndex) {
		const port = this.#ports[slotIndex];
		if (!port || this.slots[slotIndex]?.busy) return;

		// tandai busy dulu supaya read loop berhenti, lalu jangan await cancel/close tanpa batas
		this.#setSlot(slotIndex, { status: STATUS.disconnecting, busy: true });
		this.#manuallyClosed.add(port);

		const reader = this.#readers[slotIndex];
		this.#readers[slotIndex] = null;
		if (reader) await withTimeout(reader.cancel(), 250);
		await withTimeout(Promise.resolve(), 50);

		try {
			if (port.readable || port.writable) await withTimeout(port.close(), 400);
			this.#openPorts.delete(port);
			this.#setSlot(slotIndex, { status: STATUS.granted, busy: false });
		} catch (error) {
			console.warn('disconnect port gagal:', error);
			this.#openPorts.delete(port);
			this.#setSlot(slotIndex, { status: STATUS.error, busy: false });
		}
	}

	/** Port lama baru dilepas setelah pengganti benar-benar dipilih. */
	async change(slotIndex) {
		const current = this.#ports[slotIndex];
		const port = await this.#pickPort(slotIndex);
		if (!port || port === current) return;

		if (current) {
			await this.disconnect(slotIndex);
			if (typeof current.forget === 'function') await withTimeout(current.forget(), 400);
		}
		this.#ports[slotIndex] = port;
		this.#setSlot(slotIndex, { name: portLabel(port, slotIndex), status: STATUS.granted, busy: false });
		await this.open(slotIndex);
	}

	async forget(slotIndex) {
		const port = this.#ports[slotIndex];
		if (!port) return;
		if (typeof port.forget !== 'function') {
			this.#onError(
				'Browser ini belum support lepas izin port. Hapus manual di Site settings → Serial ports.'
			);
			return;
		}
		await this.disconnect(slotIndex);
		await withTimeout(port.forget(), 400);
		this.#ports[slotIndex] = null;
		this.#setSlot(slotIndex, null);
	}
}

export const scanner = new UsbScanner();
export { STATUS };
