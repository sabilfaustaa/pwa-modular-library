# `validateManifest()`

Utilitas non-composable untuk **memvalidasi struktur web app manifest**. Mengembalikan daftar *warning* (bukan error) untuk field penting yang hilang/tidak lengkap, sehingga aplikasi tetap berjalan walau manifest belum sempurna (progressive enhancement).

```ts
import { validateManifest } from "pwa-modular-library";

const warnings = validateManifest({
  name: "My App",
  short_name: "App",
  start_url: "/",
  display: "standalone",
  icons: [
    { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
    { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
  ],
});

// warnings.length === 0 → manifest lengkap
warnings.forEach((w) => console.warn(`[${w.field}] ${w.message}`));
```

## Tanda tangan

```ts
function validateManifest(manifest: unknown): ManifestWarning[];

interface ManifestWarning {
  field: string;   // nama field bermasalah ("name", "icons", ...)
  message: string; // penjelasan
}
```

## Yang diperiksa

- `name` (wajib), `short_name` (disarankan), `start_url` (wajib).
- `display` harus salah satu dari: `fullscreen`, `standalone`, `minimal-ui`, `browser`.
- `icons` minimal menyediakan ukuran **192x192** dan **512x512** (dibutuhkan install prompt & splash screen).

> Modul Manifest berperan sebagai **validasi & diagnostik**. Pembuatan berkas `manifest.json` (JSON statis) tetap ditulis oleh developer; instalasi homescreen ditangani [`useInstallPrompt`](/install-prompt).
