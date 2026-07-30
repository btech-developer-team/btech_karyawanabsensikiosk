<script>
  import { onDestroy, onMount } from "svelte";
  import AbsensiTable from "$lib/components/AbsensiTable.svelte";
  import ScanFeedback from "$lib/components/ScanFeedback.svelte";
  import AppToast from "$lib/components/AppToast.svelte";
  import SyncIndicator from "$lib/components/SyncIndicator.svelte";
  import UsbSlots from "$lib/components/UsbSlots.svelte";
  import SettingModal from "$lib/components/SettingModal.svelte";
  import { processScan } from "$lib/absensi.js";
  import { VIDEO_URL } from "$lib/config.js";
  import { allAbsensiToday, findKaryawan } from "$lib/db.js";
  import { loading } from "$lib/loading.svelte.js";
  import { scanner } from "$lib/scanner.svelte.js";
  import { createNfcScanner } from "$lib/nfcscanner.js";
  import { fetchKaryawan, syncAbsensi } from "$lib/sync.js";
  import { addToast } from "$lib/toast.svelte.js";
  import "./page.css";

  let rows = $state([]);
  let firstLoad = $state(true);
  let loadingState = $state(true);
  let feedback = $state(null);
  let feedbackTimer;
  let manualCode = $state("");

  // last-scan per USB slot index
  let lastScans = $state([]);
  let nfcScannerInstance;

  // setting modal
  let settingOpen = $state(false);

  // triple-click logo
  let logoClickCount = $state(0);
  let logoClickTimer;
  const TRIPLE_CLICK_MS = 800;

  function showErrorToast(title, body) {
    addToast({
      title,
      body: String(body ?? "Terjadi kesalahan."),
      type: "error",
      duration: 5000
    });
  }

  function onLogoClick() {
    logoClickCount += 1;
    clearTimeout(logoClickTimer);
    if (logoClickCount >= 3) {
      logoClickCount = 0;
      settingOpen = true;
      return;
    }
    logoClickTimer = setTimeout(() => (logoClickCount = 0), TRIPLE_CLICK_MS);
  }

  function showFeedback(result) {
    clearTimeout(feedbackTimer);
    feedback = {
      type: result.type,
      message: result.message,
      nama: result.user?.nama,
      avatar: result.user?.avatar,
      at: new Date().toLocaleString("id-ID")
    };
    feedbackTimer = setTimeout(() => (feedback = null), 2000);
  }

  async function reloadRows() {
    rows = await allAbsensiToday();
  }

  async function trySync() {
    if (!navigator.onLine) return;
    try {
      await loading.wrap("Mengirim sinkronisasi ke server...", syncAbsensi);
      await reloadRows();
    } catch (error) {
      console.warn("sync gagal:", error);
      showErrorToast("Sinkronisasi gagal", error.message);
    }
  }

  async function handleScan(raw, slotIndex = null) {
    const result = await processScan(raw);
    if (result.type === "ignored") return;
    showFeedback(result);

    if (slotIndex != null && result.user) {
      const karyawan = await findKaryawan(String(raw).trim());
      if (karyawan) {
        const updated = [...lastScans];
        updated[slotIndex] = {
          id: karyawan.id,
          nama: karyawan.nama,
          avatar: karyawan.avatar ?? null
        };
        lastScans = updated;
      }
    }

    await reloadRows();
    if (result.type === "success") await trySync();
  }

  async function submitManual() {
    const value = manualCode.trim();
    manualCode = "";
    if (!value) {
      showFeedback({ type: "error", message: "Masukkan kode yang valid." });
      return;
    }
    await handleScan(value);
  }

  async function refreshAll() {
    loadingState = true;
    await loading.wrap("Sinkronisasi data absensi...", async () => {
      if (navigator.onLine) {
        const [karyawan, sync] = await Promise.allSettled([
          fetchKaryawan(),
          syncAbsensi()
        ]);
        if (karyawan.status === "rejected") {
          showErrorToast(
            "Gagal muat karyawan",
            karyawan.reason?.message ?? karyawan.reason
          );
        }
        if (sync.status === "rejected") {
          showErrorToast(
            "Gagal sync absensi",
            sync.reason?.message ?? sync.reason
          );
        }
      }
      await reloadRows();
      firstLoad = false;
      loadingState = false;
    });
  }

  onMount(() => {
    const stopScanner = scanner.start({
      onScan: handleScan,
      onError: (message) => showErrorToast("Scanner", message)
    });
    refreshAll();

    const onOnline = () => refreshAll();
    const onOffline = () => reloadRows();
    nfcScannerInstance = createNfcScanner({
      onScan: handleScan,
      minLength: 8,
      threshold: 30,
      cooldown: 1000
    });
    nfcScannerInstance.start();
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    function requestVideoCache() {
      const msg = { type: "cache-media", urls: [VIDEO_URL] };
      const sw = navigator.serviceWorker;
      if (!sw) return;
      sw.controller?.postMessage(msg);
      sw.ready.then((reg) => reg.active?.postMessage(msg)).catch(() => {});
    }
    requestVideoCache();
    navigator.serviceWorker?.addEventListener("controllerchange", requestVideoCache);

    const focusTimer = setInterval(() => {
      if (!settingOpen) document.activeElement?.focus();
    }, 1000);

    return () => {
      stopScanner();
      clearInterval(focusTimer);
      clearTimeout(feedbackTimer);
      clearTimeout(logoClickTimer);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      navigator.serviceWorker?.removeEventListener("controllerchange", requestVideoCache);
    };
  });

  onDestroy(() => {
    nfcScannerInstance?.stop();
  });
</script>

<div class="kiosk">
  <div class="left-section">
    <video src={VIDEO_URL} autoplay loop muted playsinline controls></video>
  </div>

  <div class="right-section">
    <div class="berl-logo-container mt-3">
      <button
        type="button"
        class="logo-btn"
        onclick={onLogoClick}
        aria-label="Buka pengaturan (klik 3x)"
        tabindex="-1"
      >
        <img
          src="/images/logoberl.png"
          alt="Logo Berlian"
          class="logo-berlian"
        />
      </button>
    </div>

    <UsbSlots {lastScans} />

    <p class="scan-hint mb-0">
      Anda juga bisa menggunakan <span class="text-danger">QR Code Scanner</span>
      atau kartu <span class="text-danger">RFID</span> Anda untuk absen.
    </p>

    <div class="d-flex align-items-center justify-content-between gap-2">
      <button
        type="button"
        class="btn btn-sm btn-primary fw-bold"
        onclick={refreshAll}
      >
        Refresh Data Absensi
      </button>
      <SyncIndicator />
    </div>

    <AbsensiTable {rows} loading={loadingState} {firstLoad} />
  </div>
</div>

<ScanFeedback {feedback} />
<SettingModal bind:open={settingOpen} />
<AppToast />
