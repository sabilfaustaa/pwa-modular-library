# Panduan Commit & Push ke GitHub

Panduan ini menjelaskan langkah demi langkah cara melakukan commit perubahan ke repositori `pwa-modular-library` dan mem-push-nya ke GitHub. Proyek ini menggunakan **Conventional Commits** (divalidasi oleh `commitlint`) serta **Husky hooks** yang menjalankan `pnpm test:run` sebelum commit.

Repositori remote: `https://github.com/sabilfaustaa/pwa-modular-library`

---

## 1. Prasyarat

Pastikan tools berikut sudah terpasang di mesin Anda:

- **Node.js** `>= 20`
- **pnpm** (lihat `package.json` — skrip memakai `pnpm`)
- **Git** `>= 2.30`
- Akses tulis ke repository GitHub `sabilfaustaa/pwa-modular-library`

Verifikasi versi:

```bash
node -v
pnpm -v
git --version
```

---

## 2. Konfigurasi Git Awal (sekali saja per mesin)

```bash
git config --global user.name "Nama Anda"
git config --global user.email "email@anda.com"
```

Disarankan memakai autentikasi SSH atau Personal Access Token (PAT) untuk push ke GitHub.

---

## 3. Clone Repositori (jika belum ada)

```bash
git clone https://github.com/sabilfaustaa/pwa-modular-library.git
cd pwa-modular-library
pnpm install
```

Perintah `pnpm install` akan otomatis memicu `husky` (lihat skrip `prepare`) sehingga git hooks aktif.

---

## 4. Membuat Branch Kerja

Jangan commit langsung ke `main`. Buat branch baru dengan penamaan jelas:

```bash
git checkout main
git pull origin main
git checkout -b feat/nama-fitur
```

Konvensi nama branch yang disarankan:

- `feat/<nama-fitur>` untuk fitur baru
- `fix/<deskripsi-bug>` untuk perbaikan bug
- `docs/<area>` untuk update dokumentasi
- `chore/<task>` untuk tugas pemeliharaan
- `refactor/<area>` untuk refactor tanpa perubahan perilaku

---

## 5. Lakukan Perubahan & Jalankan Quality Checks

Setelah mengedit kode, jalankan pemeriksaan lokal sebelum commit:

```bash
pnpm format
pnpm lint
pnpm typecheck
pnpm test:run
pnpm build
```

Opsional — cek ukuran bundel:

```bash
node scripts/check-bundle-size.mjs
```

Kalau salah satu langkah gagal, perbaiki dulu sebelum commit.

---

## 6. Staging Perubahan

Hindari `git add .` agar tidak menyertakan file liar. Tambahkan file secara spesifik:

```bash
git status
git add src/path/to/file.ts
git add docs/nama-file.md
git diff --cached
```

Untuk menambahkan semua perubahan yang terkait tugas:

```bash
git add -u
git add <file-baru-spesifik>
```

Pastikan tidak ada file sensitif (misal `.env`, credentials) yang ikut ter-stage.

---

## 7. Commit dengan Conventional Commits

Proyek ini memvalidasi pesan commit melalui `commitlint.config.cjs`. Format yang diterima:

```
<type>(<scope opsional>): <subject singkat>

<body opsional, baris kosong sebelum body>

<footer opsional, misal BREAKING CHANGE atau issue reference>
```

`type` yang diperbolehkan:

`feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `style`, `perf`, `ci`, `build`, `revert`

Batasan penting: **baris body maksimum 100 karakter**. Pecah body menjadi beberapa baris (gunakan beberapa `-m` atau editor).

Contoh pesan commit yang valid:

```bash
git commit -m "feat(cache): add stale-while-revalidate strategy"
git commit -m "fix(sync): handle 429 backoff correctly"
git commit -m "docs(readme): update installation steps"
```

Alternatif interaktif memakai Commitizen (sudah terpasang sebagai devDependency):

```bash
pnpm exec cz
```

### Apa yang terjadi saat commit

1. `pre-commit` hook menjalankan `pnpm test:run` — commit gagal bila ada test yang merah.
2. `commit-msg` hook menjalankan `commitlint` — commit gagal bila format pesan salah.

Kalau perlu bypass hook (hanya untuk keadaan darurat yang dibenarkan):

```bash
git commit --no-verify -m "chore: emergency fix"
```

---

## 8. Push ke GitHub

Push branch dengan `-u` agar tracking ke remote tersimpan:

```bash
git push -u origin feat/nama-fitur
```

Untuk push berikutnya pada branch yang sama cukup:

```bash
git push
```

---

## 9. Membuat Pull Request

Buka URL yang ditampilkan oleh Git setelah push, atau pakai GitHub CLI:

```bash
gh pr create \
  --base main \
  --head feat/nama-fitur \
  --title "feat(cache): add stale-while-revalidate strategy" \
  --body "Ringkasan perubahan, cara test, dan catatan rilis."
```

Isi PR description dengan:

- **Summary** — apa yang diubah dan alasannya
- **Testing** — perintah test yang dijalankan + hasilnya
- **Breaking changes** — jika ada
- **Issue reference** — `Closes #123` bila relevan

---

## 10. Setelah PR Di-merge

```bash
git checkout main
git pull origin main
git branch -d feat/nama-fitur
git push origin --delete feat/nama-fitur
```

---

## 11. Update `CHANGELOG.md`

Sebelum rilis versi baru, tambahkan entri di `CHANGELOG.md` mengikuti format Keep a Changelog yang sudah dipakai. Lihat `docs/npm-publish-guide.md` untuk alur rilis lengkap.

---

## Troubleshooting Singkat

| Masalah | Penyebab & Solusi |
|---|---|
| `commitlint` menolak pesan | Cek format `<type>: <subject>`, pakai type yang valid, subject huruf kecil |
| `body-max-line-length` | Baris body lebih dari 100 karakter — pecah jadi beberapa baris |
| Pre-commit hook gagal | Test merah — perbaiki dulu, jalankan `pnpm test:run` lokal |
| `husky` tidak aktif | Jalankan `pnpm install` ulang agar hook ter-install |
| Push ditolak (rejected) | Remote lebih baru — `git pull --rebase origin main` lalu push lagi |
| Salah commit file sensitif | Jangan push. `git reset --soft HEAD~1`, hapus dari staging, commit ulang |
