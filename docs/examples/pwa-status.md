# Contoh: Status PWA & Update

Demo `usePWA` — registrasi service worker, deteksi update, dan status koneksi reaktif, lengkap dengan log peristiwa lifecycle.

## Demo

<ClientOnly>
  <PwaStatusDemo />
</ClientOnly>

## Cara mencoba

1. **Amati registrasi** — saat halaman dimuat, log mencatat `✓ SW terdaftar` dan badge `isRegistered` menyala.
2. **Simulasi offline** — matikan jaringan (DevTools → Network → Offline): badge `isOnline` berubah reaktif dan log mencatat transisinya.
3. **Periksa update** — klik *Periksa Update*; dengan `autoUpdate: false`, SW baru (jika ada) menunggu konfirmasi — `update()` setara tombol "Perbarui" pada aplikasi nyata.
4. **Unregister** — lepas registrasi SW, lalu muat ulang halaman untuk mendaftar kembali.

## Kode sumber

```vue
<script setup lang="ts">
import { usePWA } from "pwa-modular-library";

const { isRegistered, hasUpdate, isOnline, update, unregister } = usePWA({
  swPath: "/sw.js",
  autoUpdate: false,
  onRegistered: (reg) => console.log("SW aktif, scope:", reg.scope),
  onUpdateAvailable: () => console.log("Versi baru tersedia!"),
  onError: (err) => console.error("Registrasi gagal:", err.message),
});
</script>

<template>
  <p v-if="!isOnline">⚠️ Sedang offline</p>
  <button v-if="hasUpdate" @click="update">Muat ulang untuk update</button>
</template>
```

Lihat dokumentasi API lengkap di [usePWA](/service-worker).
