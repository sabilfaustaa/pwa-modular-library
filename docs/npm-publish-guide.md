# Panduan Publish ke npm

Panduan ini menjelaskan langkah demi langkah cara mem-publish package `pwa-modular-library` ke registry npm. Konfigurasi publish saat ini:

- `name`: `pwa-modular-library`
- `version`: `1.0.0-rc.1` (release candidate)
- `type`: `module` (ESM) dengan dual build (`.mjs` + `.cjs`) dan types (`.d.ts`)
- `files`: `["dist", "CHANGELOG.md", "LICENSE"]`
- `prepack`: otomatis menjalankan `pnpm build` sebelum publish
- `sideEffects`: `false` (tree-shakeable)

Registry: [https://www.npmjs.com](https://www.npmjs.com)

---

## 1. Prasyarat

- **Node.js** `>= 20`
- **pnpm** sesuai `package.json`
- **Akun npm** yang sudah aktif dan terverifikasi email
- **2FA (two-factor auth)** aktif di akun npm (sangat disarankan)
- Akses publish ke nama package `pwa-modular-library`

Cek tools:

```bash
node -v
pnpm -v
npm -v
```

---

## 2. Cek Ketersediaan Nama Package

```bash
npm view pwa-modular-library
```

- Jika muncul `404` — nama masih tersedia, Anda bisa publish sebagai owner pertama.
- Jika muncul metadata package — nama sudah dipakai. Opsi:
  - Pakai scope, contoh: ubah `"name"` di `package.json` menjadi `"@sabilfaustaa/pwa-modular-library"`
  - Atau pilih nama lain.

Untuk scoped package publik, perlu flag `--access public` saat publish.

---

## 3. Login ke npm

```bash
npm login
```

Ikuti prompt (username, password, email, OTP 2FA). Verifikasi:

```bash
npm whoami
```

Alternatif untuk CI — pakai token:

```bash
npm config set //registry.npmjs.org/:_authToken <NPM_TOKEN>
```

Jangan commit token ke repo. Untuk CI simpan di secrets.

---

## 4. Persiapan Sebelum Publish

### 4.1 Pastikan working tree bersih & di branch rilis

```bash
git status
git checkout main
git pull origin main
```

### 4.2 Tentukan versi baru

Proyek ini memakai [Semantic Versioning](https://semver.org/):

- `MAJOR` — breaking change
- `MINOR` — fitur baru backward-compatible
- `PATCH` — bug fix backward-compatible
- Pre-release — `1.0.0-rc.1`, `1.0.0-beta.2`, dll.

Bump versi dengan npm (otomatis commit + tag bila repo git bersih):

```bash
# 1.0.0-rc.1 → 1.0.0-rc.2
npm version prerelease --preid=rc

# rilis stabil pertama: 1.0.0-rc.1 → 1.0.0
npm version 1.0.0

# bump minor: 1.0.0 → 1.1.0
npm version minor

# bump patch: 1.1.0 → 1.1.1
npm version patch
```

Bila tidak menginginkan auto-commit, pakai `--no-git-tag-version`.

### 4.3 Update CHANGELOG.md

Tambahkan entri versi baru mengikuti format Keep a Changelog yang sudah ada. Contoh:

```markdown
## [1.0.0] — 2026-05-20

### Added
- ...

### Changed
- ...

### Fixed
- ...
```

Commit perubahan CHANGELOG:

```bash
git add CHANGELOG.md
git commit -m "docs(changelog): release 1.0.0"
```

---

## 5. Quality Checks Menyeluruh

```bash
pnpm install
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test:run
pnpm test:coverage
pnpm build
```

Cek ukuran bundel:

```bash
node scripts/check-bundle-size.mjs
```

Semua harus lulus sebelum lanjut.

---

## 6. Verifikasi Hasil Build

```bash
ls -la dist/
```

Pastikan file berikut ada:

- `dist/index.mjs` — entry ESM
- `dist/index.cjs` — entry CommonJS
- `dist/index.d.ts` — type declarations

Uji impor dari hasil build:

```bash
node -e "import('./dist/index.mjs').then(m => console.log(Object.keys(m)))"
```

---

## 7. Simulasi Publish (Dry Run)

### 7.1 Lihat konten package

```bash
npm pack --dry-run
```

Pastikan:

- Hanya isi `dist/` + `package.json` + `README.md` + `LICENSE` + `CHANGELOG.md` yang muncul.
- Tidak ada `src/`, `tests/`, `node_modules/`, `.env`, atau file sensitif.

### 7.2 Buat tarball lokal

```bash
npm pack
tar -tzf pwa-modular-library-1.0.0.tgz
```

### 7.3 Simulasi publish

```bash
npm publish --dry-run
```

---

## 8. Publish ke npm

### 8.1 Rilis Pre-release (release candidate / beta)

```bash
npm publish --tag next
```

atau

```bash
npm publish --tag beta
```

Pengguna memasangnya:

```bash
pnpm add pwa-modular-library@next
```

### 8.2 Rilis Stabil

```bash
npm publish
```

### 8.3 Rilis Scoped Package

```bash
npm publish --access public
```

### 8.4 Yang terjadi saat `npm publish`

1. `prepack` dijalankan → `pnpm build`.
2. npm membuat tarball berbasis `files` di `package.json`.
3. npm meminta OTP bila 2FA aktif.
4. Tarball diunggah ke registry.

---

## 9. Verifikasi Publish

```bash
npm view pwa-modular-library
npm view pwa-modular-library versions --json
npm view pwa-modular-library dist-tags
```

Uji instalasi di proyek kosong:

```bash
mkdir /tmp/test-install && cd /tmp/test-install
pnpm init
pnpm add pwa-modular-library
node -e "import('pwa-modular-library').then(m => console.log(Object.keys(m)))"
```

---

## 10. Push Tag Git ke GitHub

```bash
git push origin main
git push origin --tags
```

Buat GitHub Release:

```bash
gh release create v1.0.0 \
  --title "v1.0.0" \
  --notes-file CHANGELOG.md
```

---

## 11. Mengelola Tag Dist

```bash
npm dist-tag ls pwa-modular-library
npm dist-tag add pwa-modular-library@1.0.0 latest
npm dist-tag rm pwa-modular-library next
```

---

## 12. Unpublish & Deprecate

### Deprecate (disarankan)

```bash
npm deprecate pwa-modular-library@1.0.0 "Ada bug kritis, gunakan 1.0.1+"
```

### Unpublish (hindari bila memungkinkan)

npm hanya mengizinkan unpublish dalam 72 jam setelah publish:

```bash
npm unpublish pwa-modular-library@1.0.0
```

---

## 13. Otomatisasi via GitHub Actions (opsional)

Simpan sebagai `.github/workflows/publish.yml`:

```yaml
name: Publish to npm

on:
  push:
    tags:
      - "v*"

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "pnpm"
          registry-url: "https://registry.npmjs.org"
      - run: pnpm install --frozen-lockfile
      - run: pnpm test:run
      - run: pnpm build
      - run: npm publish --provenance --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

Tambahkan `NPM_TOKEN` di GitHub repo → Settings → Secrets → Actions. Gunakan token tipe **Automation** dari npm agar tidak memerlukan OTP.

---

## Checklist Rilis Ringkas

- [ ] Working tree bersih, berada di `main` terbaru
- [ ] `pnpm lint && pnpm typecheck && pnpm test:run && pnpm build` lulus
- [ ] `CHANGELOG.md` di-update
- [ ] Versi di-bump via `npm version ...`
- [ ] `npm pack --dry-run` diperiksa, tidak ada file liar
- [ ] `npm publish` (tambahkan `--tag next` bila pre-release)
- [ ] `git push origin main && git push origin --tags`
- [ ] GitHub Release dibuat
- [ ] Verifikasi `npm view pwa-modular-library` dan test install

---

## Troubleshooting

| Masalah | Penyebab & Solusi |
|---|---|
| `403 Forbidden` saat publish | Belum login, tidak punya hak, atau nama package sudah dipakai |
| `E402 Payment Required` scoped | Scoped private butuh paid plan — pakai `--access public` |
| `EOTP` / OTP invalid | 2FA aktif — `--otp=123456` atau masukkan saat prompt |
| `ENEEDAUTH` | Belum login — `npm login` |
| Versi sudah pernah di-publish | Tidak bisa publish ulang — bump versi |
| File `src/` ikut ter-publish | Cek field `files` di `package.json` |
| `prepack` gagal | Build error — cek `pnpm build` manual |
| Tarball terlalu besar | Tinjau `files`, jalankan `npm pack --dry-run` |
