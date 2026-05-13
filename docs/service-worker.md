# Service Worker — `usePWA()`

Composable `usePWA()` untuk mendaftarkan dan mengelola lifecycle Service Worker. Menangani registrasi, deteksi pembaruan, status online/offline, serta pembersihan otomatis ketika komponen Vue di-unmount.

---

## 1. API

```ts
import { usePWA } from "pwa-modular-library";

const { isRegistered, hasUpdate, isOnline, update, unregister } = usePWA(options?);
```

### Options (`UsePWAOptions`)

| Properti | Tipe | Default | Keterangan |
|---|---|---|---|
| `swPath` | `string` | `"/sw.js"` | Path ke berkas Service Worker |
| `scope` | `string` | `"/"` | Scope registrasi Service Worker |
| `autoUpdate` | `boolean` | `true` | Apakah aplikasi melakukan reload otomatis ketika pembaruan tersedia |
| `onRegistered` | `(reg: ServiceWorkerRegistration) => void` | — | Callback saat SW berhasil didaftarkan |
| `onUpdateAvailable` | `() => void` | — | Callback saat pembaruan SW tersedia |
| `onError` | `(error: Error) => void` | — | Callback saat registrasi gagal |

### Return (`UsePWAReturn`)

| Properti | Tipe | Keterangan |
|---|---|---|
| `isRegistered` | `Readonly<Ref<boolean>>` | `true` jika SW berhasil didaftarkan |
| `hasUpdate` | `Readonly<Ref<boolean>>` | `true` jika pembaruan SW tersedia (versi baru menunggu aktivasi) |
| `isOnline` | `Readonly<Ref<boolean>>` | Status koneksi jaringan (`navigator.onLine`, reaktif) |
| `update()` | `() => Promise<void>` | Memicu pemeriksaan pembaruan secara manual |
| `unregister()` | `() => Promise<boolean>` | Membatalkan registrasi SW dan mereset status |

---

## 2. Contoh Penggunaan

### Dasar — Registrasi + Deteksi Pembaruan

```vue
<script setup lang="ts">
import { usePWA } from "pwa-modular-library";

const { isRegistered, hasUpdate, isOnline } = usePWA({
  onUpdateAvailable: () => {
    console.log("Versi baru tersedia! Memuat ulang...");
  },
  onError: (error) => {
    console.error("Gagal mendaftarkan Service Worker:", error);
  },
});
</script>

<template>
  <div>
    <p v-if="!isSupported">Service Worker tidak didukung pada browser ini.</p>
    <p v-if="isRegistered">✅ Service Worker aktif</p>
    <p v-if="hasUpdate">🔄 Pembaruan tersedia — muat ulang halaman</p>
    <p v-if="!isOnline">⚠️ Offline</p>
  </div>
</template>
```

### Pembaruan Manual

```ts
const { update } = usePWA({ autoUpdate: false });

// Dipicu manual (misalnya dari tombol "Periksa Pembaruan")
await update();
```

### Unregister

```ts
const { unregister, isRegistered } = usePWA();

await unregister();
// isRegistered.value → false
```

---

## 3. Dukungan Browser

Service Worker didukung pada Chrome 45+, Edge 79+, Firefox 44+, Safari 11.1+, Samsung Internet 4.0+.

Library akan fail gracefully: jika browser tidak mendukung, `isRegistered` tetap `false` dan error dikirim ke callback `onError`.

---

## 4. Catatan

- Berkas Service Worker (`/sw.js`) **harus** disediakan oleh aplikasi pengguna. Library **tidak** membuat berkas SW secara otomatis.
- Gunakan `generateSW()` untuk menghasilkan kode SW yang sudah menyertakan listener aturan cache.
- Pembersihan listener online/offline dilakukan secara otomatis melalui `onUnmounted` (hanya jika dipanggil di dalam `setup()` komponen Vue).
- Jika dipanggil di luar konteks Vue (misalnya pada `main.ts`), listener akan tetap terpasang; pengguna bertanggung jawab untuk melepasnya.
