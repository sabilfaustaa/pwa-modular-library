# Changelog

Seluruh perubahan penting pada library ini dicatat dalam berkas ini.

Format berbasis [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
dan proyek ini mengikuti [Semantic Versioning](https://semver.org/lang/id/).

---

## [1.0.0-rc.1] — 2026-05-12

Rilis kandidat pertama. API publik final sesuai PRD. Library siap diukur untuk studi komparatif Putaran 1.

### Added
- `usePWA()` — composable untuk registrasi & lifecycle Service Worker (deteksi pembaruan, online/offline, unregister)
- `useCacheConfig()` — composable caching deklaratif berbasis aturan (cache-first, network-first, stale-while-revalidate, network-only, cache-only)
- `useNotifications()` — composable notifikasi lokal + push subscription (VAPID) dengan validasi VAPID key
- `useBackgroundSync()` — composable background sync untuk antrean permintaan HTTP (berbasis IndexedDB, idempotency key, backoff exponential/linear)
- `useInstallPrompt()` — composable untuk menangkap event `beforeinstallprompt` (A2HS)
- Validator manifest (`validateManifest()`) untuk validasi `manifest.json`
- Matriks dukungan browser & deteksi kapabilitas (`checkCapabilities()`)
- Utilitas logger dengan flag `DEBUG`
- Skrip verifikasi ukuran bundel (`scripts/check-bundle-size.mjs`)
- Pengujian verifikasi tree-shakeability
- Dokumentasi user-facing lengkap per composable pada `docs/`

### Changed
- Paradigma caching: dari imperatif per-permintaan → deklaratif berbasis aturan
- Status composable: dari plain object → `Readonly<Ref<T>>` Vue 3
- Aturan `useCacheConfig` disimpan in-memory + sinkronisasi ke Service Worker melalui `postMessage`
- Penegakan `maxEntries` melalui LRU eviction (header `x-pwa-cache-accessed-at`)
- Target Node 20+, Vite 5.x, Vue 3.4+

### Removed
- Agregator tingkat atas `createPWA()` (merusak tree-shaking)
- Composable lama: `useCache`, `useNotification` (bentuk tunggal), `useSync`, `useCapability`, `useStorage`

### Fixed
- VAPID public key yang tidak valid kini melempar `PWAError` dengan pesan yang actionable (bukan diam-diam mengembalikan null)
- Listener online/offline dibersihkan secara otomatis melalui `onUnmounted` pada konteks Vue

---

## [0.1.0] — 2026-05-11

Versi prototipe awal sebelum penyelarasan dengan PRD. Tidak disarankan untuk digunakan.

