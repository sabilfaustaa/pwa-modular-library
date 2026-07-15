# PLAN.md — Artefak Inti `pwa-modular-library`

> Dokumen operasional untuk **artefak inti skripsi** (kontribusi utama). Repo ini adalah **library
> modular Vue 3 + TypeScript** yang mengabstraksi fitur PWA menjadi composable tree-shakeable,
> divalidasi lewat 2 studi kasus × 2 versi (CBT & Tixlane).
>
> **Sumber: fable-work-docs/plan-cbt-pwa.md (KT-1 / iterasi DSR) + STATUS_PROYEK.md, diselaraskan 2026-07-02.**

---

## 0. Status Terverifikasi (2 Jul 2026, dicek langsung dari git)

| Aspek | Status nyata | Bukti |
|---|---|---|
| Git | ✅ commit `f4f5eb3 feat(generate-sw): precache, skipNonGet, navigationFallback, cacheVersion (v1.1.0)` | working tree bersih |
| Tag rilis | ✅ **`v1.1.0`** ada (juga `v0.1.0`) | `git tag` |
| Versi paket | **1.1.0** | `package.json` |
| Pengujian | ✅ **171 tes / 18 berkas lulus** (pre-commit Husky `pnpm test:run`, commitlint aktif) | — |
| Publikasi NPM | 🔴 **belum dipublish** (panduan ada di `docs/npm-publish-guide.md`) | — |

**API publik (final):** 5 composable — `usePWA()`, `useCacheConfig()`, `useNotifications()`, `useBackgroundSync()`, `useInstallPrompt()` — + util non-composable `generateSW()` & `validateManifest()`.

## 1. Iterasi DSR v1.0.1 → v1.1.0 (KT-1) — ✅ SELESAI, wajib diceritakan di naskah

Iterasi ini adalah **langkah DSR yang sah** (umpan balik demonstrasi CBT → penyempurnaan desain artefak), **bukan** tambal-sulam. `generateSW()` ditingkatkan dengan opsi:

- `precache: string[]` — precache app-shell ber-hash (sebelumnya hanya cache-on-fetch).
- `skipNonGet` (default `true`) — **perbaikan bug nyata**: `cache.put()` pada request non-GET (`PUT /sesi/{id}/jawaban`) melempar TypeError; kini di-skip.
- `navigationFallback` — fallback SPA ke `/index.html`.
- `cacheVersion` (+ cleanup cache lama saat `activate`) — relevan TC-CBT-06.
- `skipWaiting:false` (default — menunggu pesan `SKIP_WAITING`) — memungkinkan state "waiting" → `usePWA().hasUpdate` true → banner update muncul & user konfirmasi (setara SW manual Versi A).

`usePWA().update()` juga ditingkatkan: mengaktifkan waiting worker (kirim `SKIP_WAITING` + reload saat `controllerchange`).

## 2. Checklist tindak lanjut

- [ ] **Replikasi konsisten:** hasil v1.1.0 (terutama `generateSW` opsi baru & `skipWaiting:false`) **wajib dipakai identik** di `cbt-pwa-library` **dan** `tixlane-ground-handle-library` — agar klaim RM#4 (composable identik lintas domain) valid.
- [ ] **Ukur ulang LoC/bundle library saat freeze** — naskah menulis "164 skenario / 18 berkas" & "3.074 baris fisik / 1.980 LoC" (basis v1.0.0); kini **171 tes**. Perbarui di 4.3.1/4.3.6 agar tidak terlihat usang saat sidang. → `../docs/PERLU_INPUT_PENULIS.md` butir 1.1.
- [ ] **Keputusan publish NPM:** publish bila ingin klaim "tersedia di NPM" di 4.3.6 — kalau tidak dipublish, **jangan klaim** tersedia di NPM. → `../docs/PERLU_INPUT_PENULIS.md` butir 4 (nama resmi library).
- [ ] **Konsistensi strategi caching yang diklaim vs diukur:** README/CHANGELOG menyebut SWR/cache-only/network-only; paritas pengukuran hanya `cache-first` + `network-first`. Pastikan yang diukur konsisten dengan yang diklaim.
- [ ] **`validateManifest()` (KT-3):** util (bukan composable), tidak di-wire runtime di host CBT/Tixlane (manifest statis). Selaraskan naskah (Bab I–III menyebut 4 composable) — nyatakan sebagai util DX opsional di luar paritas.

## 3. Aturan emas (constraint)

1. **Artefak dikonsumsi sebagai dependency** (`file:../pwa-modular-library`) oleh kedua repo `*-library` — jangan di-copy. Perubahan API di sini berdampak lintas repo.
2. **Setiap perubahan = iterasi DSR ber-CHANGELOG + bump versi + tag.** Pre-commit menjalankan seluruh tes; jaga tetap hijau. Commitlint: header ≤100 karakter.
3. **Jaga paritas:** jangan menambah kapabilitas yang dipakai hanya di satu domain lalu diklaim lintas domain.

> Sumber selaras: `fable-work-docs/plan-cbt-pwa.md` (KT-1, M-CBT-5 butir "update angka artefak"). Konteks lengkap di [`CLAUDE.md`](CLAUDE.md).
