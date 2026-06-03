# Contoh: Konfigurasi Cache & `count()`

Demo `useCacheConfig` — kelola aturan caching deklaratif secara reaktif, dan hitung jumlah entri tersimpan dengan `count()`.

## Demo

<ClientOnly>
  <CacheConfigDemo />
</ClientOnly>

## Kode sumber

```vue
<script setup lang="ts">
import { useCacheConfig } from "pwa-modular-library";

const { rules, addRule, removeRule, clearAll, count } = useCacheConfig();

addRule({ pattern: "/api/*", strategy: "network-first", cacheName: "api-cache" });
const total = await count(); // jumlah entri (bukan byte)
</script>
```

> Penerapan strategi ke request nyata berjalan di service worker — hasilkan `sw.js` dengan [`generateSW`](/utilities/generate-sw). Lihat dokumentasi API lengkap di [useCacheConfig](/cache).
