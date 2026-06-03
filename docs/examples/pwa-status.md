# Contoh: Status PWA & Update

Demo `usePWA` — registrasi service worker, deteksi update, dan status koneksi reaktif.

## Demo

<ClientOnly>
  <PwaStatusDemo />
</ClientOnly>

## Kode sumber

```vue
<script setup lang="ts">
import { usePWA } from "pwa-modular-library";

const { isRegistered, hasUpdate, isOnline, update, unregister } = usePWA({
  swPath: "/sw.js",
  autoUpdate: false,
  onUpdateAvailable: () => console.log("Versi baru tersedia!"),
});
</script>

<template>
  <p v-if="!isOnline">⚠️ Sedang offline</p>
  <button v-if="hasUpdate" @click="update">Muat ulang untuk update</button>
</template>
```

Lihat dokumentasi API lengkap di [usePWA](/service-worker).
