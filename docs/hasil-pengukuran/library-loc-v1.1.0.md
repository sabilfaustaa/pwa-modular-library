# Pengukuran Ulang: LoC, Tes, dan Tree-Shaking — `pwa-modular-library` v1.1.0

> Dokumen pendukung Skripsi BAB V (§ ukuran basis kode efektif artefak versi 1.1.0).
> Menggantikan angka lama v1.0.0 (3.074 baris / 164 tes) yang sudah usang.

## Metadata Eksekusi

| Item | Nilai |
|------|-------|
| Tanggal pengukuran | 2026-07-08 |
| Commit hash | `f4f5eb3` (tag `v1.1.0`) |
| Branch | `main` |
| Tool LoC | `cloc` v2.06 |
| Runner tes | Vitest 1.6.1 (`pnpm test:run`) |
| Script tree-shaking | `node scripts/check-bundle-size.mjs` |

Catatan: pada saat pengukuran, working tree memiliki beberapa perubahan lokal belum
di-commit (`CHANGELOG.md`, `README.md`, `bench/REKAP_BUNDLE.md`, `bench/REKAP_TEST_LIBRARY.md`,
`docs/utilities/generate-sw.md`, serta `PLAN.md` baru). **Tidak ada perubahan pada `src/`** —
sehingga HEAD tetap identik dengan tag `v1.1.0` untuk keperluan pengukuran LoC, tes, dan bundle.

## 1. LoC Efektif `src/` (v1.1.0)

### Metode

`cloc src/` — menghitung baris kode (code), mengecualikan baris kosong (blank) dan
komentar (comment) secara otomatis per bahasa. Direktori `tests/`, `dist/`, `node_modules/`,
dan `docs/` **tidak termasuk** karena berada di luar `src/`.

```
cloc src/
```

### Hasil

| Language   | files | blank | comment | code |
|------------|------:|------:|--------:|-----:|
| TypeScript |    36 |   446 |     727 | **2081** |

- **Jumlah berkas TypeScript:** 36 berkas (semua `.ts`, tidak ada `.tsx`/`.vue` di `src/`).
- **Berkas `.d.ts`:** **0** — tidak ada berkas deklarasi tipe manual di dalam `src/`
  (`dist/index.d.ts` dihasilkan build, berada di `dist/`, di luar cakupan `src/`).
  Karena itu, **LoC dengan vs tanpa `.d.ts` identik: 2081 baris** (tidak ada berkas
  `.d.ts` untuk dikecualikan).
- **Berkas tes** (`*.test.ts`, `*.spec.ts`): **0** ditemukan di dalam `src/` — seluruh
  tes berada di direktori terpisah `tests/`, sehingga tidak mempengaruhi angka LoC di atas.
- Total baris fisik (code + comment + blank) = 2081 + 727 + 446 = 3254.

### Rincian per berkas (top 10 terbesar)

| Berkas | Code |
|--------|-----:|
| `src/modules/caching/manager.ts` | 214 |
| `src/modules/service-worker/sw-template.ts` | 209 |
| `src/modules/push-sync/notification-manager.ts` | 166 |
| `src/modules/push-sync/sync-queue.ts` | 153 |
| `src/modules/push-sync/sync-storage.ts` | 122 |
| `src/modules/caching/strategies.ts` | 108 |
| `src/composables/usePWA.ts` | 103 |
| `src/composables/useInstallPrompt.ts` | 92 |
| `src/modules/service-worker/registry.ts` | 89 |
| `src/composables/useNotifications.ts` | 84 |

*(Rincian lengkap 36 berkas tersedia via `cloc src/ --by-file`.)*

### Catatan perbandingan dengan angka v1.0.0

Angka lama yang tercatat sebelumnya (3.074 baris / 164 tes) berasal dari commit `9ba8e30`
(v1.0.0, run 2026-06-14) dan **tidak dapat direkonsiliasi langsung** dengan angka di atas karena
metodologi run tersebut tidak terdokumentasi di repo ini (kemungkinan mencakup basis
perhitungan berbeda, mis. total baris fisik alih-alih baris kode `cloc`, atau cakupan direktori
berbeda). Dokumen ini menetapkan **2081 baris kode efektif (`cloc`, tanpa blank/comment)**
sebagai angka resmi v1.1.0, dengan metode yang eksplisit dan dapat direproduksi
(`cloc src/`).

## 2. Verifikasi Jumlah Tes

### Perintah

```
pnpm test:run
```

### Hasil

| Metrik | Jumlah |
|--------|-------:|
| Test files | **18** |
| Total tes | **171** |
| Pass | **171** |
| Fail | **0** |
| Skip | 0 |

**Konfirmasi: sesuai `bench/REKAP_TEST_LIBRARY.md` (171 tes / 18 berkas, 0 gagal).** Tidak ada
selisih. Output `stderr` yang muncul selama run (mis. `PWAError: SW_REGISTRATION_ERROR`,
`[Vue warn]: onUnmounted ...`) adalah log yang sengaja dipicu skenario uji jalur-error/lifecycle,
bukan indikasi kegagalan — konsisten dengan catatan pada `bench/REKAP_TEST_LIBRARY.md`.

## 3. Verifikasi Tree-Shaking (KNF-02)

### Perintah

```
node scripts/check-bundle-size.mjs
```

### Hasil

| Composable / Bundle | gzip | Batas |
|---|---:|---:|
| `useInstallPrompt` | 0.52 KB | < 5 KB ✅ |
| `usePWA` | 1.41 KB | < 5 KB ✅ |
| `useNotifications` | 1.68 KB | < 5 KB ✅ |
| `useBackgroundSync` | 2.07 KB | < 5 KB ✅ |
| `useCacheConfig` | 2.44 KB | < 5 KB ✅ |
| **Full library** | **11.22 KB** | < 25 KB ✅ |

**Konfirmasi: sesuai `bench/REKAP_BUNDLE.md` Tabel 2 v1.1.0** (per-composable 0.52–2.44 KB gzip,
full library 11.22 KB gzip). Tidak ada selisih. Semua composable tetap jauh di bawah budget
per-composable (5 KB) maupun budget bundle penuh (25 KB), mengonfirmasi tree-shaking
(`sideEffects: false`) bekerja sebagaimana diklaim KNF-02.

## Ringkasan untuk BAB V

> Ukuran basis kode efektif artefak versi 1.1.0 adalah **2.081 baris kode** (`cloc`, 36 berkas
> TypeScript, tanpa blank/comment, tanpa berkas `.d.ts` karena tidak ada di `src/`), dengan
> **171 tes lulus (18 berkas, 0 gagal)** dan bundle penuh **11.22 KB gzip** (per-composable
> 0.52–2.44 KB gzip) yang mengonfirmasi tree-shaking KNF-02.
