export function pad(n) {
	return String(n).padStart(2, '0');
}

/** Waktu lokal perangkat kiosk — harus lokal, bukan UTC, karena dibanding dengan jam shift. */
export function nowParts(date = new Date()) {
	return {
		isoDate: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
		time: `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`,
		display: date.toLocaleString('id-ID')
	};
}

export function timeToSeconds(timeString) {
	if (!timeString || timeString === '-') return null;
	const parts = String(timeString).trim().split(':');
	if (parts.length < 2) return null;
	const h = Number(parts[0]);
	const m = Number(parts[1]);
	const s = Number(parts[2] || 0);
	if ([h, m, s].some((n) => Number.isNaN(n))) return null;
	return h * 3600 + m * 60 + s;
}

/** 2026-07-29 -> 29-07-2026 */
export function formatDate(dateString) {
	if (!dateString) return '-';
	const [year, month, day] = String(dateString).split(' ')[0].split('-');
	if (!year || !month || !day) return '-';
	return `${day}-${month}-${year}`;
}
