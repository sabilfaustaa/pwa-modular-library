# Contoh: Generator `sw.js`

Demo `generateSW` — susun cache rules, hasilkan kode service worker, lalu unduh `sw.js`. Coba mode static embed maupun dynamic postMessage.

## Demo

<ClientOnly>
  <GenerateSwDemo />
</ClientOnly>

## Kode sumber

```ts
import { generateSW } from "pwa-modular-library";

const rules = [
  { pattern: "/api/*", strategy: "network-first", cacheName: "api-cache" },
  { pattern: "/assets/*", strategy: "cache-first", cacheName: "asset-cache" },
];

// static embed (default)
const code = generateSW(rules);

// dynamic postMessage
const dynamic = generateSW([], { kirimRulesViaPostMessage: true });
```

Lihat dokumentasi utilitas lengkap di [generateSW](/utilities/generate-sw).
