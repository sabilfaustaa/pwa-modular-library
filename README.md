# PWA Modular Library

Library modular Vue 3 + TypeScript untuk akselerasi implementasi **Progressive Web Apps (PWA)**.

Dirancang dengan pendekatan **Composition API first** — setiap fitur adalah composable `useXxx()` yang tree-shakeable, type-safe, dan fail gracefully pada browser yang tidak mendukung.

---

## Fitur

| Fitur | Composable | Dukungan Browser |
|---|---|---|
| Lifecycle Service Worker | `usePWA()` | Chrome 45+, Edge 79+, Firefox 44+, Safari 11.1+ |
| Strategi Caching | `useCacheConfig()` | Chrome 43+, Edge 79+, Firefox 41+, Safari 11.1+ |
| Push Notification | `useNotifications()` | Chrome 42+, Edge 79+, Firefox 44+, Safari 16+ |
| Antrean Request Luring (Offline Queue) | `useBackgroundSync()` | Semua browser ber-IndexedDB (berbasis event `online`, bukan SyncManager) |
| Install Prompt (A2HS) | `useInstallPrompt()` | Chrome 45+, Edge 79+, Samsung Internet 4+ |

Utilitas non-composable: `generateSW()` (generator kode service worker dari cache rules) dan `validateManifest()` (validasi web app manifest) — keduanya diekspor dari entry publik.

---

## Instalasi

```bash
npm install pwa-modular-library
```

**Dependensi peer** (wajib telah terpasang di proyek Anda):
- `vue` ≥ 3.4.0

---

## Mulai Cepat

### 1. Service Worker

```vue
<script setup lang="ts">
import { usePWA } from 'pwa-modular-library'

const { isRegistered, hasUpdate, isOnline, update } = usePWA({
  swPath: '/sw.js',
  onUpdateAvailable: () => console.log('Update tersedia!'),
})
</script>

<template>
  <div v-if="hasUpdate">
    Update tersedia!
    <button @click="update">Update sekarang</button>
  </div>
</template>
```

### 2. Caching

```ts
import { useCacheConfig } from 'pwa-modular-library'

const { addRule, clearAll } = useCacheConfig([
  {
    pattern: /\/api\/exams\/.*/,
    strategy: 'network-first',
    maxAge: 3600,
  },
  {
    pattern: /\.(png|jpg|svg)$/,
    strategy: 'cache-first',
    maxEntries: 100,
  },
])
```

### 3. Push Notification

```vue
<script setup lang="ts">
import { useNotifications } from 'pwa-modular-library'

const { permission, isSupported, isSubscribed, subscribe, show } = useNotifications({
  vapidPublicKey: 'BN...your-public-key',
})

async function enableNotifications() {
  const sub = await subscribe()
  if (sub) {
    await show({ title: 'Berhasil!', body: 'Notifikasi aktif.' })
  }
}
</script>
```

### 4. Antrean Request Luring (Offline Queue)

```ts
import { useBackgroundSync } from 'pwa-modular-library'

const { enqueue, pendingCount, flush } = useBackgroundSync('exam-answers', {
  maxRetries: 3,
  backoff: 'exponential', // jeda retry: baseDelayMs × 2^retryCount
  onSyncSuccess: (entry) => console.log('Tersimpan:', entry.id),
})

async function submitAnswer(data: unknown) {
  await enqueue({
    url: '/api/exams/submit',
    method: 'POST',
    body: data,
  })
}
```

### 5. Install Prompt (Add to Home Screen)

```vue
<script setup lang="ts">
import { useInstallPrompt } from 'pwa-modular-library'

const { isSupported, canPrompt, prompt } = useInstallPrompt()

async function handleInstall() {
  const result = await prompt()
  if (result === 'accepted') console.log('App ter-install!')
}
</script>

<template>
  <button v-if="canPrompt" @click="handleInstall">
    Install App
  </button>
</template>
```

---

## Arsitektur

```
┌─────────────────────────────────────────────┐
│              Vue.js 3 Apps                  │
└──────────────────┬──────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│           Composables API                   │  ← Public API
│  usePWA  useCacheConfig  useNotifications   │
│  useBackgroundSync  useInstallPrompt        │
└──────┬──────────┬──────────┬────────┬──────┘
       ↓          ↓          ↓        ↓
┌──────────┐ ┌─────────┐ ┌────────┐ ┌────────┐
│ Service  │ │ Caching │ │Manifest│ │ Push & │
│ Worker   │ │ Module  │ │ Module │ │  Sync  │
│ Module   │ │         │ │        │ │ Module │
└──────────┴─┴─────────┴─┴────────┴─┴────────┘
       ↓          ↓          ↓        ↓
┌─────────────────────────────────────────────┐
│             PWA Library Core                │
│   (Shared utilities, types, constants)      │
└─────────────────────────────────────────────┘
```

---

## Tree-Shaking

Setiap composable bisa diimpor independen. Import `usePWA` **tidak** akan mem-bundle `useNotifications`:

```
usePWA              1.41 KB gzip
useCacheConfig      2.44 KB gzip
useNotifications    1.68 KB gzip
useBackgroundSync   2.07 KB gzip
useInstallPrompt    0.52 KB gzip
Full library       11.22 KB gzip  (termasuk util generateSW & validateManifest)
```

> Angka di atas terukur pada **v1.1.0** via `node scripts/check-bundle-size.mjs` (2026-07-02). Rincian & metodologi: [`bench/REKAP_BUNDLE.md`](bench/REKAP_BUNDLE.md). Util `generateSW`/`validateManifest` hanya masuk bundle bila benar-benar diimpor (tree-shakeable).

---

## Dukungan Browser

Library menggunakan pendekatan **progressive enhancement** — fitur yang tidak didukung browser akan fail gracefully dengan boolean flag `isSupported`.

Lihat [docs/browser-support.md](./docs/browser-support.md) untuk matriks dukungan lengkap.

---

## Dokumentasi

- [Matriks Dukungan Browser](./docs/browser-support.md)
- [Panduan Memulai](./docs/getting-started.md)
- [Service Worker (`usePWA`)](./docs/service-worker.md)
- [Caching (`useCacheConfig`)](./docs/cache.md)
- [Notifikasi (`useNotifications`)](./docs/notification.md)
- [Antrean Request Luring (`useBackgroundSync`)](./docs/sync.md)
- [Install Prompt (`useInstallPrompt`)](./docs/install-prompt.md)

---

## Pengembangan

```bash
pnpm install
pnpm typecheck        # Periksa tipe TypeScript
pnpm build            # Build library (ESM + CJS + .d.ts)
pnpm test:run         # Jalankan seluruh pengujian (Vitest)
pnpm test:coverage    # Pengujian + laporan cakupan
pnpm docs:dev         # Jalankan website dokumentasi (VitePress) lokal
pnpm docs:build       # Build website dokumentasi statis
```

### Website dokumentasi

Dokumentasi komprehensif + contoh interaktif dibangun dengan **VitePress** di folder `docs/`. Jalankan `pnpm docs:dev` lalu buka `http://localhost:5173`. Komponen demo mengimpor library via alias `pwa-modular-library` (→ `src/index.ts`) sehingga berperilaku persis seperti konsumen.

---

## Lisensi

MIT

**Dikembangkan oleh Muhamad Sabil Fausta** — artefak penelitian skripsi *"Pengembangan Library Modular untuk Akselerasi Implementasi Progressive Web Apps berbasis Vue.js 3 dan TypeScript"*.
