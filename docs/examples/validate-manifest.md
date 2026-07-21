# Contoh: Validator Manifest

Demo `validateManifest` — tempel JSON `manifest.json` (atau pakai preset sekali klik), lalu lihat daftar warning untuk field penting yang kurang.

## Demo

<ClientOnly>
  <ValidateManifestDemo />
</ClientOnly>

## Cara mencoba

1. **Preset lengkap** — klik *Manifest lengkap* → 0 warning: aplikasi memenuhi syarat manifest untuk installability.
2. **Preset minim** — klik *Manifest minim* → muncul daftar warning per field (`short_name`, `start_url`, `display`, `icons`).
3. **Edit langsung** — hapus/ubah field di textarea lalu klik *Validasi*; JSON yang rusak dilaporkan sebagai parse error, bukan crash.

## Kode sumber

```ts
import { validateManifest } from "pwa-modular-library";

const warnings = validateManifest({
  name: "My App",
  start_url: "/",
  display: "standalone",
  icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }],
});

warnings.forEach((w) => console.warn(`[${w.field}] ${w.message}`));
```

Lihat dokumentasi utilitas lengkap di [validateManifest](/utilities/validate-manifest).
