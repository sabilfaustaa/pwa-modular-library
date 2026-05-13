# Panduan Memulai

Panduan memulai `pwa-modular-library` di proyek Vue 3 Anda.

---

## 1. Instalasi

### Opsi A — Instal dari berkas lokal (disarankan untuk keperluan riset)

```bash
npm install ../pwa-modular-library
# atau
pnpm add ../pwa-modular-library
```

### Opsi B — Registri npm (setelah publikasi)

```bash
npm install pwa-modular-library
```

### Dependensi Peer

Pastikan proyek Anda telah memiliki:

```json
{
  "dependencies": {
    "vue": "^3.4.0"
  }
}
```

---

## 2. Setup Dasar

Library ini **tidak** memiliki agregator tingkat atas. Impor setiap composable sesuai kebutuhan:

```ts
// main.ts
import { createApp } from "vue";
import App from "./App.vue";

createApp(App).mount("#app");
```

```vue
<!-- App.vue -->
<script setup lang="ts">
import { usePWA } from "pwa-modular-library";
// import { useCacheConfig } from "pwa-modular-library";
// import { useNotifications } from "pwa-modular-library";
// import { useBackgroundSync } from "pwa-modular-library";
// import { useInstallPrompt } from "pwa-modular-library";

// Daftarkan Service Worker
const { isRegistered, hasUpdate, isOnline } = usePWA({
  swPath: "/sw.js",
  onUpdateAvailable: () => {
    console.log("Pembaruan tersedia!");
  },
});
</script>
```

---

## 3. Lima Composable Utama

| Composable | Kegunaan |
|---|---|
| [`usePWA()`](./service-worker.md) | Registrasi & lifecycle Service Worker |
| [`useCacheConfig()`](./cache.md) | Konfigurasi caching deklaratif (aturan + strategi) |
| [`useNotifications()`](./notification.md) | Izin notifikasi + push subscription (VAPID) |
| [`useBackgroundSync()`](./sync.md) | Antrean permintaan HTTP untuk pendekatan offline-first |
| [`useInstallPrompt()`](./install-prompt.md) | Menangkap prompt Add-to-Home-Screen |

---

## 4. Berkas Service Worker

Library **tidak** membuat berkas SW secara otomatis. Anda perlu menghasilkan berkas `/sw.js` menggunakan `generateSW()`:

```ts
// scripts/generate-sw.ts
import { generateSW } from "pwa-modular-library/sw";
import fs from "node:fs";

const swCode = generateSW([
  { pattern: "/api/*", strategy: "network-first" },
  { pattern: "/assets/*", strategy: "cache-first", maxEntries: 100 },
]);

fs.writeFileSync("public/sw.js", swCode, "utf-8");
```

Atau buat berkas SW secara manual yang mengimpor library:

```js
// public/sw.js
importScripts("/assets/pwa-library-sw.js");

self.addEventListener("message", (event) => {
  // Tangani pesan dari thread utama
});
```

---

## 5. Dukungan Browser

Library menggunakan pendekatan **progressive enhancement**. Setiap composable memiliki properti `isSupported` yang bernilai `false` jika fitur tidak didukung browser.

Lihat [browser-support.md](./browser-support.md) untuk matriks dukungan lengkap.

---

## 6. Selanjutnya

- [Service Worker →](./service-worker.md)
- [Caching →](./cache.md)
- [Notifikasi →](./notification.md)
- [Background Sync →](./sync.md)
- [Install Prompt →](./install-prompt.md)
