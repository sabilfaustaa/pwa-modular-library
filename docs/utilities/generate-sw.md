# `generateSW()`

Utilitas non-composable untuk **menghasilkan kode service worker** dari daftar cache rules, sebagai langkah build. `generateSW` mengembalikan string kode JavaScript SW lengkap dengan listener `fetch` dan penerapan strategi caching.

```ts
import { generateSW } from "pwa-modular-library";
import { writeFileSync } from "node:fs";

const rules = [
  { pattern: "/api/*", strategy: "network-first", cacheName: "api-cache" },
  { pattern: "/assets/*", strategy: "cache-first", cacheName: "asset-cache" },
];

writeFileSync("public/sw.js", generateSW(rules));
```

## Tanda tangan

```ts
function generateSW(rules: readonly CacheRule[], options?: GenerateSWOptions): string;

interface GenerateSWOptions {
  /** true → SW meminta rules dari main thread via postMessage (mode dinamis). */
  kirimRulesViaPostMessage?: boolean;
}
```

## Dua mode

| Mode | Pemanggilan | Kegunaan |
|---|---|---|
| **Static embed** (default) | `generateSW(rules)` | Rules diketahui saat build, ditanam langsung ke `sw.js`. |
| **Dynamic postMessage** | `generateSW([], { kirimRulesViaPostMessage: true })` | Rules dikirim runtime dari `useCacheConfig` via pesan `SABIL_PWA_CACHE_RULES_UPDATE`. |

## Skrip build bawaan

```bash
# static embed dari file rules JSON
node scripts/generate-sw.mjs --rules ./cache-rules.json --out ./public/sw.js

# dynamic postMessage
node scripts/generate-sw.mjs --out ./public/sw.js --post-message
```

> Catatan: rules tidak otomatis aktif begitu ditambahkan lewat `useCacheConfig`. Pada mode static, regenerasi `sw.js` adalah langkah build; pada mode dynamic, `useCacheConfig` mem-broadcast rules ke SW yang sudah memuat handler postMessage.
