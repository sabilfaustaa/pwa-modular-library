# Caching — `useCacheConfig()`

Composable `useCacheConfig()` menyediakan konfigurasi caching deklaratif berbasis **aturan (rules)**. Setiap aturan berisi pola URL (`pattern`), strategi, dan nama cache opsional. Aturan disinkronisasi ke Service Worker melalui `postMessage` untuk dieksekusi pada thread SW.

---

## 1. API

```ts
import { useCacheConfig } from "pwa-modular-library";

const { rules, addRule, removeRule, clearAll, clear, count } = useCacheConfig(initialRules?);
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
  pattern: string | RegExp;    // Pola URL — lihat §2 (anchoring & batasan)
  strategy: CacheStrategy;     // Lihat §3
  cacheName?: string;          // Nama cache (opsional)
  maxAge?: number;             // Diterima tipe, BELUM diterapkan runtime — lihat §5
  maxEntries?: number;         // Diterima tipe, BELUM diterapkan runtime — lihat §5
}
```

---

## 2. Bentuk `pattern` (anchoring & batasan)

`pattern` menerima `string` atau `RegExp`, tetapi keduanya **tidak setara**. Pilihannya bergantung pada cara aturan sampai ke Service Worker.

### Pola string dicocokkan ter-anchor ke URL penuh

Secara internal, `*` diterjemahkan menjadi `.*`, lalu pola diuji sebagai `^<pola>$` terhadap **URL utuh** (`https://host/assets/app.js`) — bukan terhadap path saja. Akibatnya pola yang terlihat wajar justru tidak pernah cocok:

| Pola | Terhadap `https://app.example.com/assets/app.js` |
|---|---|
| `"/assets/*"` | ❌ **tidak pernah** match — URL tidak diawali `/assets/` |
| `"*/assets/*"` | ✅ match |
| `/\/assets\//` (RegExp) | ✅ match — RegExp diuji tanpa anchor |

### RegExp tidak bertahan di mode static embed

`generateSW(rules)` menyisipkan rules ke dalam `sw.js` melalui `JSON.stringify`. `RegExp` tidak memiliki `toJSON`, sehingga ter-serialisasi menjadi `{}` — bukan string, bukan RegExp — dan tidak pernah cocok dengan URL apa pun.

| Konteks | Pola string ter-anchor | `RegExp` |
|---|---|---|
| `useCacheConfig()` (registry di memori) | ✅ | ✅ |
| `generateSW(rules)` — static embed *(default)* | ✅ | ❌ hancur menjadi `{}` |
| `generateSW([], { kirimRulesViaPostMessage: true })` | ✅ | ✅ — structured clone mempertahankan RegExp |

**Pegangan praktis:** pakai `RegExp` untuk aturan yang diberikan ke `useCacheConfig()`, dan pola string **ter-anchor** (`"*/assets/*"`) untuk aturan yang di-embed lewat `generateSW(rules)`.

---

## 3. Strategi Caching (`CacheStrategy`)

| Strategi | Perilaku | Cocok Untuk |
|---|---|---|
| `"cache-first"` | Periksa cache lebih dulu, fallback ke jaringan | Aset statis (gambar, font, CSS) |
| `"network-first"` | Coba jaringan lebih dulu, fallback ke cache | Data API yang sering berubah |
| `"stale-while-revalidate"` | Kembalikan cache, perbarui di latar belakang | Data yang boleh sedikit usang (berita, avatar) |
| `"network-only"` | Selalu ambil dari jaringan, tidak disimpan di cache | Data real-time |
| `"cache-only"` | Hanya dari cache, gagal jika tidak tersedia | Aset yang telah di-precache |

---

## 4. Contoh Penggunaan

### Dasar — Mendaftarkan Aturan

Aturan di bawah diberikan langsung ke `useCacheConfig()`, sehingga `RegExp` aman dipakai (lihat §2).

```ts
const { rules, addRule } = useCacheConfig();

addRule({
  pattern: /\/api\/news\//,
  strategy: "stale-while-revalidate",
  cacheName: "news-cache",
});

addRule({
  pattern: /\/assets\//,
  strategy: "cache-first",
  cacheName: "asset-cache",
});

// rules.value sekarang berisi 2 aturan
// Aturan otomatis disiarkan ke SW melalui postMessage
```

### Menghapus Aturan

`removeRule` mencocokkan aturan berdasarkan bentuk tekstual `pattern`, jadi berikan pola yang sama persis seperti saat `addRule`.

```ts
const removed = removeRule(/\/api\/news\//);
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

## 5. `maxAge` & `maxEntries` — belum diterapkan

Kedua properti **diterima oleh tipe `CacheRule` tetapi belum berpengaruh pada runtime**: tidak ada kode di library yang membacanya — baik di registry thread utama maupun di service worker hasil `generateSW()`. Menyetelnya tidak menimbulkan error, tetapi juga **tidak** membatasi umur maupun jumlah entri cache.

Karena itu dokumen ini **tidak menyebutkan satuan** untuk `maxAge`: satuan baru bermakna ketika properti ini benar-benar diimplementasikan.

Untuk saat ini, kelola umur dan ukuran cache dengan:

- **`cacheVersion` pada [`generateSW()`](/utilities/generate-sw)** — bump versi, cache lama dihapus otomatis saat `activate`.
- **`clear(cacheName)` / `clearAll()`** — pembersihan manual dari thread utama.

---

## 6. Cara Kerja Internal

- **Aturan disimpan di memori thread utama**, bukan di IndexedDB.
- Setiap `addRule`/`removeRule` menyiarkan aturan ke Service Worker melalui `navigator.serviceWorker.controller.postMessage()` dengan pesan `SABIL_PWA_CACHE_RULES_UPDATE`.
- Service Worker menerima aturan pada event `message` dan menggunakannya untuk intersepsi `fetch`.
- Saat SW baru dijalankan (cold start), SW meminta aturan kepada klien melalui pesan `SABIL_PWA_CACHE_RULES_REQUEST`, lalu klien membalas dengan `SABIL_PWA_CACHE_RULES_UPDATE`.
- Aturan pertama yang cocok yang dipakai (**first-match wins**) — urutan pendaftaran menentukan prioritas.

---

## 7. Dukungan Browser

Cache API didukung pada Chrome 43+, Edge 79+, Firefox 41+, Safari 11.1+, Samsung Internet 4.0+.

Jika browser tidak mendukung Cache API, `addRule` tetap berfungsi (aturan tersimpan di memori) namun tidak memberi efek pada SW — sumber daya tetap diambil dari jaringan.

---

## 8. Catatan

- Aturan **tidak dipertahankan** melewati pemuatan ulang halaman. Inisialisasi ulang aturan melalui `useCacheConfig(initialRules)` setiap kali aplikasi dimuat.
- Berkas SW harus dibangkitkan menggunakan `generateSW()` dari `pwa-modular-library` agar listener `message` untuk aturan cache ikut terpasang. Agar SW menerima aturan dari `useCacheConfig`, bangkitkan dalam mode dinamis: `generateSW([], { kirimRulesViaPostMessage: true })`.
