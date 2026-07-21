# Contoh: Konfigurasi Cache & `count()`

Demo `useCacheConfig` — susun aturan caching deklaratif, uji URL mana yang ditangani rule mana (*first-match wins*), lalu hitung entri Cache API dengan `count()`.

## Demo

<ClientOnly>
  <CacheConfigDemo />
</ClientOnly>

## Cara mencoba

1. **Tambah rule** — biarkan pola default `*/api/*`, pilih strategi, klik *+ Tambah Rule*. Tambahkan satu lagi, mis. `*/assets/*` dengan `cache-first`.
2. **Uji URL** — ketik URL apa pun di langkah 2. Rule yang menangani ditandai hijau; kalau tidak ada yang cocok, request lewat ke jaringan tanpa caching.
3. **Rasakan jebakan anchoring** — tambahkan pola `/api/*` (tanpa `*` di depan), lalu uji `https://app.example.com/api/users`: pola itu tidak akan pernah cocok, karena pola string diuji ter-anchor terhadap URL **penuh**.
4. **count()** — tambah entri contoh ke Cache API dan lihat penghitungnya berubah.

## Kode sumber

```vue
<script setup lang="ts">
import { useCacheConfig } from "pwa-modular-library";

const { rules, addRule, removeRule, clearAll, count } = useCacheConfig();

addRule({ pattern: /\/api\//, strategy: "network-first", cacheName: "api-cache" });
const total = await count(); // jumlah entri (bukan byte)
</script>
```

> Penerapan strategi ke request nyata berjalan di service worker — hasilkan `sw.js` dengan [`generateSW`](/utilities/generate-sw). Lihat dokumentasi API lengkap di [useCacheConfig](/cache).
>
> Aturan di atas diberikan langsung ke `useCacheConfig()`, jadi `RegExp` aman dipakai. Untuk aturan yang di-embed lewat `generateSW(rules)`, pakai pola string ter-anchor (`"*/api/*"`) — lihat [§2 Bentuk `pattern`](/cache#_2-bentuk-pattern-anchoring-batasan).
