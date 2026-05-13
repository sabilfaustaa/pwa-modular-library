# Modul Penyimpanan (Utilitas Internal)

> ⚠️ **Modul ini adalah utilitas internal.** Bukan bagian dari API publik library.
> Untuk kebutuhan penyimpanan di aplikasi Anda, gunakan library `idb` atau API IndexedDB secara langsung.

---

## Keterangan

Modul `StorageModule` dan `IndexedDBStorage` merupakan wrapper IndexedDB yang digunakan **secara internal** oleh `useBackgroundSync()` untuk menyimpan antrean sinkronisasi.

**Tidak tersedia pada API publik.** Pengguna tidak dapat mengimpor `useStorage` atau `IndexedDBStorage` dari `pwa-modular-library`.

---

## Jika Membutuhkan Penyimpanan Sendiri

Gunakan `idb` secara langsung (sudah menjadi dependensi library):

```ts
import { openDB } from "idb";

const db = await openDB("my-app-db", 1, {
  upgrade(db) {
    db.createObjectStore("my-store");
  },
});

await db.put("my-store", { id: 1, name: "example" }, "key-1");
const item = await db.get("my-store", "key-1");
```

Atau gunakan API IndexedDB langsung jika tidak memerlukan wrapper yang ergonomis.

---

**Lihat juga:** [Background Sync →](./sync.md) untuk penggunaan antrean yang telah memanfaatkan IndexedDB secara otomatis.
