# Caching — `useCacheConfig()`

Composable `useCacheConfig()` menyediakan konfigurasi caching deklaratif berbasis **aturan (rules)**. Setiap aturan berisi pola URL (`pattern`), strategi, TTL, dan batas jumlah entri. Aturan disinkronisasi ke Service Worker melalui `postMessage` untuk dieksekusi pada thread SW.

---

## 1. API

```ts
import { useCacheConfig } from "pwa-modular-library";

const { rules, addRule, removeRule, clearAll, clear, size } = useCacheConfig(initialRules?);
```

### Parameter

| Parameter | Tipe | Default | Keterangan |
|---|---|---|---|
| `initialRules` | `CacheRule[]` | `[]` | Daftar aturan awal (opsional) |

### Return (`UseCacheConfigReturn`)

| Properti | Tipe | Keterangan |
|---|---|---|
| `rules` | `Readonly<Ref<CacheRule[]>>` | Daftar aturan yang sedang aktif (reaktif) |
| `addRule(rule)` | `(rule: CacheRule) => void` | Menambah atau mengganti aturan berdasarkan `pattern` |
| `removeRule(pattern)` | `(pattern: string \| RegExp) => boolean` | Menghapus aturan; mengembalikan `false` jika tidak ditemukan |
| `clearAll()` | `() => Promise<void>` | Membersihkan **seluruh** entri cache + menghapus semua aturan |
| `clear(cacheName)` | `(cacheName: string) => Promise<boolean>` | Membersihkan cache tertentu; mengembalikan `false` jika gagal |
| `count()` | `() => Promise<number>` | Jumlah entri yang tersimpan di cache (bukan byte) |

### `CacheRule`

```ts
interface CacheRule {
  pattern: string | RegExp;    // Pola URL (glob-like atau RegExp)
  strategy: CacheStrategy;     // Lihat §2
  maxAge?: number;             // TTL dalam milidetik
  maxEntries?: number;         // Batas jumlah entri (LRU eviction)
}
```

---

## 2. Strategi Caching (`CacheStrategy`)

| Strategi | Perilaku | Cocok Untuk |
|---|---|---|
| `"cache-first"` | Periksa cache lebih dulu, fallback ke jaringan | Aset statis (gambar, font, CSS) |
| `"network-first"` | Coba jaringan lebih dulu, fallback ke cache | Data API yang sering berubah |
| `"stale-while-revalidate"` | Kembalikan cache, perbarui di latar belakang | Data yang boleh sedikit usang (berita, avatar) |
| `"network-only"` | Selalu ambil dari jaringan, tidak disimpan di cache | Data real-time |
| `"cache-only"` | Hanya dari cache, gagal jika tidak tersedia | Aset yang telah di-precache |

---

## 3. Contoh Penggunaan

### Dasar — Mendaftarkan Aturan

```ts
const { rules, addRule } = useCacheConfig();

addRule({
  pattern: "/api/news/*",
  strategy: "stale-while-revalidate",
  maxAge: 5 * 60 * 1000, // 5 menit
  maxEntries: 50,
});

addRule({
  pattern: "/assets/*",
  strategy: "cache-first",
  maxAge: 24 * 60 * 60 * 1000, // 1 hari
  maxEntries: 200,
});

// rules.value sekarang berisi 2 aturan
// Aturan otomatis disiarkan ke SW melalui postMessage
```

### Menghapus Aturan

```ts
const removed = removeRule("/api/news/*");
console.log(removed); // true
```

### Membersihkan Cache

```ts
await clear("my-cache");    // Hapus semua entri di cache 'my-cache'
await clearAll();            // Hapus semua cache + semua aturan
```

### Memeriksa Jumlah Entri

```ts
const total = await count();
console.log(`Total entri di cache: ${total}`);
```

---

## 4. Cara Kerja Internal

- **Aturan disimpan di memori thread utama**, bukan di IndexedDB.
- Setiap `addRule`/`removeRule` menyiarkan aturan ke Service Worker melalui `navigator.serviceWorker.controller.postMessage()`.
- Service Worker menerima aturan pada event `message` dan menggunakannya untuk intersepsi `fetch`.
- Saat SW baru dijalankan (cold start), SW meminta aturan kepada klien (`SABIL_PWA_REQUEST_RULES`).
- `maxEntries` menggunakan LRU eviction: entri yang paling lama tidak diakses akan dihapus terlebih dahulu. Waktu `last-accessed-at` dilacak melalui header `x-pwa-cache-accessed-at`.

---

## 5. Dukungan Browser

Cache API didukung pada Chrome 43+, Edge 79+, Firefox 41+, Safari 11.1+, Samsung Internet 4.0+.

Jika browser tidak mendukung Cache API, `addRule` tetap berfungsi (aturan tersimpan di memori) namun tidak memberi efek pada SW — sumber daya tetap diambil dari jaringan.

---

## 6. Catatan

- Aturan **tidak dipertahankan** melewati pemuatan ulang halaman. Inisialisasi ulang aturan melalui `useCacheConfig(initialRules)` setiap kali aplikasi dimuat.
- Berkas SW harus dibangkitkan menggunakan `generateSW()` dari `pwa-modular-library/sw` agar listener `message` untuk aturan cache ikut terpasang.
