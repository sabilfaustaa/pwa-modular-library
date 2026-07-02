# Rekap Pengukuran Bundle Size — `pwa-modular-library`

> Dokumen pendukung Skripsi BAB 4 (§4.1.3 KNF Modularitas, §4.3.6).
> Angka di bawah adalah **hasil terukur**, menggantikan angka indikatif lama
> (full ~10.60 KB gzip) yang hanya dipakai sebagai pembanding.

## Metadata Eksekusi

| Item | Nilai |
|------|-------|
| Tanggal | 2026-06-14 |
| Commit hash | `9ba8e30` |
| Versi library | 1.0.0 |
| Build tool | Vite 5.4.21 (lib mode) + vue-tsc (d.ts) |
| Bundler pengukur per-composable | esbuild 0.28.0 |
| `sideEffects` | `false` |
| Kompresi | zlib gzip level 9, brotli default (Node `zlib`) |

Artefak `npm run build` terbentuk lengkap: `dist/index.mjs`, `dist/index.cjs`,
`dist/index.d.ts` (+ source map & sub-path `composables/`, `core/`, `modules/`,
`types/`, `utils/`).

## Tabel 1 — Ukuran Output Build (penuh)

| Output | raw | gzip | brotli |
|--------|----:|-----:|-------:|
| `dist/index.mjs` (ESM) | 37.06 KB (37 952 B) | 10.35 KB (10 599 B) | 9.21 KB (9 426 B) |
| `dist/index.cjs` (CJS) | 28.05 KB (28 727 B) | 8.53 KB (8 738 B) | 7.65 KB (7 835 B) |
| `dist/index.d.ts` (types) | 1.50 KB (1 535 B) | 0.55 KB (560 B) | 0.44 KB (446 B) |

## Tabel 2 — Bundle Per-Composable (impor selektif, terisolasi)

Tiap baris = bundle yang hanya mengimpor **satu** composable
(`export { useXxx } from 'pwa-modular-library'`), di-bundle dengan esbuild
(minify on, tree-shaking on, `vue`/`idb`/`date-fns` external).

| Composable | raw | gzip terisolasi |
|------------|----:|----------------:|
| useInstallPrompt | 1 368 B | **0.59 KB** (606 B) |
| usePWA | 3 687 B | **1.42 KB** (1 458 B) |
| useNotifications | 4 595 B | **1.72 KB** (1 765 B) |
| useBackgroundSync | 6 110 B | **2.18 KB** (2 231 B) |
| useCacheConfig | 6 208 B | **2.47 KB** (2 528 B) |

## Tabel 3 — Bukti Tree-Shaking

| Skenario | gzip |
|----------|-----:|
| Σ jumlah kelima bundle terisolasi | 8.39 KB (8 588 B) |
| Bundle gabungan kelima composable sekaligus | **6.52 KB** (6 681 B) |
| Selisih (overhead modul-bersama yang ter-dedup) | 1.87 KB (1 907 B) |

### Interpretasi

1. **Impor selektif tidak menyeret fitur lain.** Mengimpor satu composable saja
   menghasilkan 0.59–2.47 KB gzip — jauh di bawah 10.35 KB bundle penuh. Contoh
   ekstrem: `useInstallPrompt` hanya 0.59 KB, ≈5.7% dari bundle penuh. Ini
   membuktikan dead-code elimination memangkas composable yang tak dipakai.
2. **Modul inti dipakai bersama (shared), bukan diduplikasi.** Bundle gabungan
   kelima composable (6.52 KB) **lebih kecil** dari penjumlahan bundle terisolasi
   (8.39 KB). Selisih 1.87 KB adalah util inti (core/errors, types, helper) yang
   muncul berulang saat diukur terpisah namun di-dedup saat digabung — konsisten
   dengan arsitektur modular ber-`sideEffects:false`.

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
