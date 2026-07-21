# Contoh: Generator `sw.js`

Demo `generateSW` — pilih mode (static embed / dynamic postMessage), susun cache rules, aktifkan opsi v1.1.0 (`precache`, `navigationFallback`, `cacheVersion`, `skipNonGet`, `skipWaiting`), lalu hasilkan dan unduh kode service worker.

## Demo

<ClientOnly>
  <GenerateSwDemo />
</ClientOnly>

## Cara mencoba

1. **Generate dulu apa adanya** — klik *Generate sw.js* dan baca hasilnya: blok `install`, `activate`, `fetch`, dan rules yang ter-embed.
2. **Aktifkan `precache`** — centang lalu generate ulang; bandingkan blok `install` yang kini melakukan `cache.addAll(...)` untuk app-shell.
3. **Ganti `cacheVersion`** menjadi `v2` — perhatikan seluruh nama cache berubah menjadi `<nama>-v2`; saat `activate`, cache versi lama dibersihkan otomatis.
4. **Coba mode dynamic** — rules dikosongkan; SW yang dihasilkan meminta rules ke thread utama (`useCacheConfig`) saat cold start.

## Kode sumber

```ts
import { generateSW } from "pwa-modular-library";

const rules = [
  { pattern: "*/api/*", strategy: "network-first", cacheName: "api-cache" },
  { pattern: "*/assets/*", strategy: "cache-first", cacheName: "asset-cache" },
];

// static embed (default) + opsi v1.1.0
const code = generateSW(rules, {
  precache: ["/", "/index.html", "/assets/app.css"],
  navigationFallback: "/index.html",
  cacheVersion: "v2",
  skipNonGet: true,   // default
  skipWaiting: false, // default — update menunggu konfirmasi user
});

// dynamic: rules dikirim runtime dari useCacheConfig via postMessage
const dynamic = generateSW([], { kirimRulesViaPostMessage: true });
```

> Pola string dicocokkan ter-anchor ke URL **penuh** — `"/assets/*"` tidak pernah cocok, `"*/assets/*"` cocok. Pada mode static embed, `RegExp` ter-serialisasi menjadi `{}` oleh `JSON.stringify` sehingga tidak dapat dipakai. Lihat [§2 Bentuk `pattern`](/cache#_2-bentuk-pattern-anchoring-batasan).

Lihat dokumentasi utilitas lengkap di [generateSW](/utilities/generate-sw).
