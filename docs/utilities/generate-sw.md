# `generateSW()`

Utilitas non-composable untuk **menghasilkan kode service worker** dari daftar cache rules, sebagai langkah build. `generateSW` mengembalikan string kode JavaScript SW lengkap dengan listener `fetch` dan penerapan strategi caching.

```ts
import { generateSW } from "pwa-modular-library";
import { writeFileSync } from "node:fs";

const rules = [
  { pattern: "*/api/*", strategy: "network-first", cacheName: "api-cache" },
  { pattern: "*/assets/*", strategy: "cache-first", cacheName: "asset-cache" },
];

writeFileSync("public/sw.js", generateSW(rules));
```

## Bentuk `pattern` pada `generateSW`

Dua jebakan yang sama-sama berakhir **cache diam-diam kosong**:

1. **Pola string ter-anchor ke URL penuh.** `*` menjadi `.*`, lalu diuji sebagai `^<pola>$` terhadap URL utuh. Jadi `"/assets/*"` **tidak pernah** cocok dengan `https://host/assets/app.js`; yang benar `"*/assets/*"`.
2. **`RegExp` tidak bertahan di mode static embed.** `generateSW(rules)` menyisipkan rules lewat `JSON.stringify`, dan `RegExp` tidak punya `toJSON` — hasilnya `"pattern": {}` di dalam `sw.js`, yang tidak cocok dengan URL apa pun.

| Mode | Pola string ter-anchor | `RegExp` |
|---|---|---|
| `generateSW(rules)` — static embed *(default)* | ✅ | ❌ hancur menjadi `{}` |
| `generateSW([], { kirimRulesViaPostMessage: true })` | ✅ | ✅ — rules dikirim via structured clone |

Karena itu contoh di halaman ini memakai pola string ter-anchor. Untuk aturan yang dikelola `useCacheConfig()`, `RegExp` aman — lihat [§2 Bentuk `pattern`](/cache#_2-bentuk-pattern-anchoring-batasan).

## Tanda tangan

```ts
function generateSW(rules: readonly CacheRule[], options?: GenerateSWOptions): string;

interface GenerateSWOptions {
  /** true → SW meminta rules dari main thread via postMessage (mode dinamis). Default: false. */
  kirimRulesViaPostMessage?: boolean;
  /** URL app-shell yang di-precache saat `install`. Default: []. */
  precache?: string[];
  /** true → lewati request non-GET (POST/PUT/PATCH/DELETE) agar Cache API tak error. Default: true. */
  skipNonGet?: boolean;
  /** URL fallback untuk request navigasi (`mode === 'navigate'`) saat offline. Default: tidak ada. */
  navigationFallback?: string;
  /** Versi cache; disisipkan ke tiap nama cache (`pwa-<name>-<version>`). Default: "v1". */
  cacheVersion?: string;
  /** true → panggil `self.skipWaiting()` saat install. false → tunggu pesan SKIP_WAITING. Default: false. */
  skipWaiting?: boolean;
}
```

## Opsi lengkap

Semua opsi bersifat opsional; nilai default di bawah **1:1 dengan implementasi** (`src/modules/service-worker/sw-template.ts`).

| Opsi | Tipe | Default | Efek pada kode SW yang dihasilkan |
|---|---|---|---|
| `kirimRulesViaPostMessage` | `boolean` | `false` | `false` = rules di-*embed* langsung (mode statis). `true` = SW mulai dengan `CACHE_RULES = []` dan memintanya dari main thread via pesan `SABIL_PWA_CACHE_RULES_REQUEST`, lalu menerima `SABIL_PWA_CACHE_RULES_UPDATE`. |
| `precache` | `string[]` | `[]` | Bila tidak kosong, blok `install` menjalankan `caches.open("pwa-precache-<version>").addAll(PRECACHE_URLS)` — app-shell tersedia untuk reload offline tanpa menunggu cache-on-fetch. |
| `skipNonGet` | `boolean` | `true` | Bila `true`, handler `fetch` `return` lebih awal untuk `request.method !== "GET"`, mencegah `TypeError` dari `cache.put()` pada request non-GET (mis. `PUT /sesi/{id}/jawaban`). |
| `navigationFallback` | `string` | *(tidak ada)* | Bila diisi, request `mode === "navigate"` memakai network-first; saat gagal, menyajikan `caches.match(<fallback>)` (mis. `"/index.html"`) agar shell SPA tetap tampil offline. |
| `cacheVersion` | `string` | `"v1"` | Menyetel `const CACHE_VERSION`. Nama cache menjadi `pwa-<base>-<version>`; saat `activate`, cache berprefix `pwa-` dengan versi berbeda **dihapus otomatis**. |
| `skipWaiting` | `boolean` | `false` | `true` = `self.skipWaiting()` dipanggil saat `install` (SW baru langsung aktif). `false` = SW menunggu pesan `{ type: "SKIP_WAITING" }` dari main thread → mendukung flow pembaruan **terkonfirmasi user** (banner "Perbarui", berpasangan dengan `usePWA().update()`). |

> **Nama cache & prefix.** Seluruh cache memakai prefix konstan `pwa-`, sehingga bentuk akhirnya `pwa-<cacheName>-<cacheVersion>` (mis. `pwa-api-cache-v2`). Blok `activate` hanya menghapus cache berprefix `pwa-` yang versinya bukan `CACHE_VERSION` aktif.

## Dua mode

| Mode | Pemanggilan | Kegunaan |
|---|---|---|
| **Static embed** (default) | `generateSW(rules)` | Rules diketahui saat build, ditanam langsung ke `sw.js`. |
| **Dynamic postMessage** | `generateSW([], { kirimRulesViaPostMessage: true })` | Rules dikirim runtime dari `useCacheConfig` via pesan `SABIL_PWA_CACHE_RULES_UPDATE`. |

## Contoh: opsi produksi lengkap

Konfigurasi khas aplikasi nyata (app-shell precache + fallback SPA + versi cache + pembaruan terkonfirmasi user):

```ts
import { generateSW } from "pwa-modular-library";
import { writeFileSync } from "node:fs";

const rules = [
  { pattern: "*/api/*",    strategy: "network-first", cacheName: "api-cache" },
  { pattern: "*/assets/*", strategy: "cache-first",   cacheName: "asset-cache" },
];

const code = generateSW(rules, {
  precache: ["/", "/index.html", "/assets/app.css", "/assets/app.js"],
  navigationFallback: "/index.html", // shell SPA tetap tampil saat offline
  cacheVersion: "v2",                 // bump → cache lama dibersihkan saat activate
  skipNonGet: true,                   // default; lewati PUT/POST/…
  skipWaiting: false,                 // default; tunggu SKIP_WAITING (banner "Perbarui")
});

writeFileSync("public/sw.js", code);
```

Pasangan main-thread untuk flow pembaruan terkonfirmasi user (`skipWaiting: false`):

```ts
// Ketika user menekan tombol "Perbarui" pada banner:
navigator.serviceWorker.controller?.postMessage({ type: "SKIP_WAITING" });
// atau cukup: usePWA().update()
```

## Skrip build bawaan

```bash
# static embed dari file rules JSON
node scripts/generate-sw.mjs --rules ./cache-rules.json --out ./public/sw.js

# dynamic postMessage
node scripts/generate-sw.mjs --out ./public/sw.js --post-message
```

> Catatan: rules tidak otomatis aktif begitu ditambahkan lewat `useCacheConfig`. Pada mode static, regenerasi `sw.js` adalah langkah build; pada mode dynamic, `useCacheConfig` mem-broadcast rules ke SW yang sudah memuat handler postMessage.
