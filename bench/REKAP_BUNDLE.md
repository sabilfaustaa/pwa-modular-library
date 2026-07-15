# Rekap Pengukuran Bundle Size — `pwa-modular-library`

> Dokumen pendukung Skripsi BAB 4 (§4.1.3 KNF Modularitas, §4.3.6).
> Angka di bawah adalah **hasil terukur**, menggantikan angka indikatif lama
> (full ~10.60 KB gzip) yang hanya dipakai sebagai pembanding.

## Metadata Eksekusi

| Item | Nilai |
|------|-------|
| Tanggal | 2026-07-02 |
| Commit hash | `f4f5eb3` (tag `v1.1.0`) |
| Versi library | 1.1.0 |
| Build tool | Vite 5.4.21 (lib mode) + vue-tsc (d.ts) |
| Bundler pengukur per-composable | esbuild (via `scripts/check-bundle-size.mjs`) |
| `sideEffects` | `false` |
| Perintah reproduksi | `pnpm build` (Tabel 1) · `node scripts/check-bundle-size.mjs` (Tabel 2–3) |
| Kompresi Tabel 1 | gzip via rollup/vite (laporan build) |
| Kompresi Tabel 2–3 | Node `zlib` `gzipSync` (default level) |

> **Angka run 2026-06-14 (commit `9ba8e30`, v1.0.0) sudah usang** — bundle tumbuh di v1.1.0
> karena `generateSW()` menambah opsi (`precache`, `skipNonGet`, `navigationFallback`,
> `cacheVersion`, `skipWaiting`). `generateSW` adalah util *tree-shakeable*, jadi pertumbuhan
> hanya terasa pada bundle **penuh**, bukan pada impor per-composable.

Artefak `pnpm build` terbentuk lengkap: `dist/index.mjs`, `dist/index.cjs`,
`dist/index.d.ts` (+ source map & sub-path `composables/`, `core/`, `modules/`,
`types/`, `utils/`).

## Tabel 1 — Ukuran Output Build (penuh) — v1.1.0

Sumber: laporan `pnpm build` (Vite lib mode). raw = ukuran file `dist/`; gzip = laporan build.

| Output | raw | gzip |
|--------|----:|-----:|
| `dist/index.mjs` (ESM) | 39.98 KB | **11.49 KB** |
| `dist/index.cjs` (CJS) | 30.39 KB | **9.59 KB** |

## Tabel 2 — Bundle Per-Composable (impor selektif, terisolasi) — v1.1.0

Tiap baris = bundle yang hanya mengimpor **satu** composable, di-bundle esbuild
(minify + tree-shaking; `vue`/`idb`/`date-fns` external). Sumber: `node scripts/check-bundle-size.mjs`.

| Composable | gzip terisolasi | Batas (budget) |
|------------|----------------:|---------------:|
| useInstallPrompt | **0.52 KB** | < 5 KB ✅ |
| usePWA | **1.41 KB** | < 5 KB ✅ |
| useNotifications | **1.68 KB** | < 5 KB ✅ |
| useBackgroundSync | **2.07 KB** | < 5 KB ✅ |
| useCacheConfig | **2.44 KB** | < 5 KB ✅ |
| **Full library** (semua composable + util) | **11.22 KB** | < 25 KB ✅ |

## Tabel 3 — Bukti Tree-Shaking — v1.1.0

| Skenario | gzip |
|----------|-----:|
| Σ jumlah kelima bundle terisolasi | 8.12 KB |
| Bundle penuh (kelima composable + util `generateSW`/`validateManifest`) | 11.22 KB |
| `useInstallPrompt` terisolasi sebagai % bundle penuh | ≈4.6% (0.52 / 11.22) |

### Interpretasi

1. **Impor selektif tidak menyeret fitur lain.** Mengimpor satu composable saja
   menghasilkan 0.52–2.44 KB gzip — jauh di bawah 11.22 KB bundle penuh. Contoh
   ekstrem: `useInstallPrompt` hanya 0.52 KB (≈4.6% bundle penuh), membuktikan
   dead-code elimination memangkas composable **dan util** yang tak dipakai.
2. **Penjumlahan lima bundle terisolasi (8.12 KB) < bundle penuh (11.22 KB)** karena
   bundle penuh juga menyertakan util `generateSW`/`validateManifest` dan helper inti;
   saat hanya sebagian diimpor, sisanya di-tree-shake. Konsisten dengan `sideEffects:false`.

> **Catatan metodologi:** `check-bundle-size.mjs` versi ini melaporkan **gzip** (bukan raw/brotli)
> dan mengukur "Full library", bukan "gabungan-5-composable-saja" seperti run v1.0.0.
> Bila naskah butuh angka raw/brotli atau bundle gabungan-5 terisolasi, perlu run terpisah
> (sesuaikan skrip). Angka di atas adalah keluaran skrip apa adanya (bukan salinan histori).

## Catatan Metodologi

- **External** saat pengukuran per-composable: `vue` (peerDependency),
  `idb` & `date-fns` (runtime dependencies). Ketiganya tidak dihitung dalam
  ukuran bundle library, sesuai praktik publikasi npm di mana dependency
  di-resolve oleh consumer.
- **Minify**: aktif (esbuild `minify: true`) untuk Tabel 2 & 3.
- Pengukuran per-composable di-bundle dari artefak hasil build (`dist/index.mjs`),
  bukan dari source, sehingga merefleksikan apa yang benar-benar dikonsumsi
  pengguna paket npm.
- Gzip & brotli dihitung dengan modul `zlib` bawaan Node.js (gzip level 9).
- Angka raw = byte tak terkompres; KB = byte ÷ 1024 (dibulatkan 2 desimal).
