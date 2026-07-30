// src/lib/helpers/nfcScanner.js

/**
 * Helper untuk deteksi scan NFC/RFID (HID keyboard emulator)
 * Membedakan input scan device vs ketikan manual berdasarkan kecepatan keystroke
 */
export function createNfcScanner({
  onScan,
  minLength = 8,
  threshold = 30,
  cooldown = 1000
} = {}) {
  let buffer = "";
  let lastTime = 0;
  let isProcessing = false;
  let isActive = false;

  function handleKeydown(e) {
    const now = Date.now();
    const gap = now - lastTime;
    lastTime = now;

    if (e.key === "Enter") {
      if (buffer.length >= minLength && !isProcessing) {
        isProcessing = true;
        onScan?.(buffer);
        setTimeout(() => (isProcessing = false), cooldown);
      }
      buffer = "";
      return;
    }

    // gap kepanjangan → bukan scan device, reset buffer
    if (gap > threshold && buffer.length > 0) {
      buffer = "";
    }

    // hanya tangkap karakter tunggal (huruf/angka), abaikan tombol kontrol (Shift, Ctrl, dll)
    if (e.key.length === 1) {
      buffer += e.key;
    }
  }

  return {
    start() {
      if (isActive) return;
      document.addEventListener("keydown", handleKeydown);
      isActive = true;
    },
    stop() {
      if (!isActive) return;
      document.removeEventListener("keydown", handleKeydown);
      isActive = false;
    }
  };
}
