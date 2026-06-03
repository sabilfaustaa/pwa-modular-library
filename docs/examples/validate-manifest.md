# Contoh: Validator Manifest

Demo `validateManifest` — tempel JSON `manifest.json`, lalu lihat daftar warning untuk field penting yang kurang.

## Demo

<ClientOnly>
  <ValidateManifestDemo />
</ClientOnly>

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
