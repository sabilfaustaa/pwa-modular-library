# Changelog

Seluruh perubahan penting pada library ini dicatat dalam berkas ini.

Format berbasis [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
dan proyek ini mengikuti [Semantic Versioning](https://semver.org/lang/id/).

---

## Keputusan terbuka — Nama resmi paket (belum final)

> **Status: BUTUH INPUT PENULIS.** `package.json` saat ini bernama **`pwa-modular-library`** (v1.1.0),
> namun naskah skripsi masih memakai nama campur ("pwa modular library", "sabil pwa library",
> prefix "SABIL PWA"; internal SW memakai pesan berprefix `SABIL_PWA_*` dan cache berprefix `pwa-`).
> Nama resmi belum diputuskan penulis — lihat `../docs/PERLU_INPUT_PENULIS.md` (Prioritas 4, butir
> "Nama resmi library"). **Nama paket TIDAK diubah otomatis** sampai penulis memutuskan; setelah
> final, samakan `package.json`, README, docs, dependency `file:` di `cbt-pwa-library` &
> `tixlane-ground-handle-library`, dan seluruh naskah dalam satu perubahan ber-CHANGELOG.

---

## [1.1.0] — 2026-06-22

Iterasi artefak (DSR) hasil umpan balik demonstrasi pada studi kasus CBT (`cbt-pwa-library`). `generateSW()` sebelumnya (≤1.0.1) menghasilkan SW yang terlalu minimal untuk aplikasi nyata dengan request non-GET, app-shell, dan flow pembaruan terkonfirmasi user. Versi ini menutup kesenjangan tersebut tanpa mengubah default yang aman bagi konsumen lama (kecuali perbaikan bug non-GET).

### Added
- `generateSW()` kini menerima opsi tambahan pada `GenerateSWOptions`:
  - `precache: string[]` — precache app-shell saat `install` (reload offline menyajikan kerangka aplikasi tanpa menunggu cache-on-fetch).
  - `navigationFallback: string` — fallback app-shell untuk request navigasi (`mode === 'navigate'`) saat offline (SPA offline-capable).
  - `cacheVersion: string` — versi cache yang disisipkan ke seluruh nama cache; cache versi lama dibersihkan otomatis saat `activate`.
  - `skipWaiting: boolean` (default `false`) — saat `false`, SW menunggu pesan `{ type: 'SKIP_WAITING' }` sehingga pembaruan dapat dikonfirmasi user (banner "Perbarui").
- SW hasil `generateSW()` kini memproses pesan `{ type: 'SKIP_WAITING' }` dari main thread.
- `usePWA().update()` kini mengaktifkan waiting worker (kirim `SKIP_WAITING` + reload saat `controllerchange`) bila tersedia, sehingga setara tombol "Perbarui" pada SW manual. Bila tidak ada waiting worker, perilaku lama (pengecekan update) dipertahankan.

### Fixed
- `generateSW()` kini melewati request non-GET secara default (`skipNonGet: true`). Sebelumnya request seperti `PUT`/`POST` yang cocok sebuah rule memicu `TypeError` karena Cache API menolak `cache.put()` pada request non-GET.
- Strategi `cache-first`/`network-first`/`cache-only` kini juga mencari di seluruh cache (`caches.match`) sebagai fallback, sehingga aset yang di-precache tetap tersaji walau bukan di cache rule.

### Notes
- Perubahan default `skipNonGet` (true) dan `skipWaiting` (false) bersifat perbaikan perilaku. Konsumen yang menginginkan perilaku lama dapat menyetel `skipNonGet: false` / `skipWaiting: true`.

---

## [1.0.1] — 2026-06-16

### Fixed
- `checkCapabilities()` dan tipe `BrowserCapabilities` kini benar-benar diekspor dari entry point publik (`pwa-modular-library`). Sebelumnya fungsi ada dan teruji namun tidak ter-export dari barrel, sehingga `import { checkCapabilities } from "pwa-modular-library"` gagal bagi konsumen npm meskipun sudah didokumentasikan.

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

