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
| Antrean Background Sync | `useBackgroundSync()` | Chrome 49+, Edge 79+, Samsung Internet 4+ |
| Install Prompt (A2HS) | `useInstallPrompt()` | Chrome 45+, Edge 79+, Samsung Internet 4+ |

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

### 4. Background Sync

```ts
import { useBackgroundSync } from 'pwa-modular-library'

const { enqueue, pendingCount, flush } = useBackgroundSync('exam-answers', {
  maxRetries: 3,
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
usePWA              1.34 KB gzip
useCacheConfig      2.41 KB gzip
useNotifications    1.38 KB gzip
useBackgroundSync   1.77 KB gzip
useInstallPrompt    0.52 KB gzip
Full library        8.46 KB gzip
```

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
- [Background Sync (`useBackgroundSync`)](./docs/sync.md)
- [Install Prompt (`useInstallPrompt`)](./docs/install-prompt.md)

---

## Pengembangan

```bash
pnpm install
pnpm typecheck        # Periksa tipe TypeScript
pnpm build            # Build library (ESM + CJS + .d.ts)
pnpm test:run         # Jalankan seluruh pengujian (Vitest)
pnpm test:coverage    # Pengujian + laporan cakupan
```

---

## Lisensi

MIT

**Dikembangkan oleh Muhamad Sabil Fausta** — artefak penelitian skripsi *"Pengembangan Library Modular untuk Akselerasi Implementasi Progressive Web Apps berbasis Vue.js 3 dan TypeScript"*.
