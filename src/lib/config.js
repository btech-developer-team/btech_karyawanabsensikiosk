export const BAUD_RATE = 9600;
export const USB_SLOT_COUNT = 3;
export const DEFAULT_AVATAR = 'https://karyawan.berlcosmetics.com/fotoprofil/imgprofil/default.jpeg';
export const QR_IMAGE_BASE = 'https://karyawan.berlcosmetics.com/barcodeabsensi';
export const VIDEO_URL = 'https://s3.berlstore.com/berl/video-schid/sunscreen.mp4';

/** Endpoint SvelteKit server (`src/routes/api/.../+server.js`). */
export const API = {
	karyawan: '/api/karyawan',
	sync: '/api/sync',
	qrPath: '/api/qr-code',
};
