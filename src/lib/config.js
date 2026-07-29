export const BAUD_RATE = 9600;
export const USB_SLOT_COUNT = 3;
export const DEFAULT_AVATAR = 'https://karyawan.berlcosmetics.com/fotoprofil/imgprofil/default.jpeg';
export const VIDEO_URL = 'https://s3.berlstore.com/berl/video-schid/sunscreen.mp4';

const apiPrefix = '/api/kiosk-absensi';

export const API = {
	karyawan: `${apiPrefix}/karyawan`,
	sync: `${apiPrefix}/sync`
};
