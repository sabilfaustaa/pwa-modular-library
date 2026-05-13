# Background Sync — `useBackgroundSync()`

Composable `useBackgroundSync()` menyediakan antrean permintaan HTTP yang otomatis dikirim (flush) saat koneksi kembali online. Mendukung exponential backoff, idempotency key, serta persistensi melalui IndexedDB.

---

## 1. API

```ts
import { useBackgroundSync } from "pwa-modular-library";

const {
  queue,
  pendingCount,
  enqueue,
  flush,
  remove,
  clear,
} = useBackgroundSync(queueName, options?);
```

### Parameter

| Parameter | Tipe | Default | Keterangan |
|---|---|---|---|
| `queueName` | `string` | **wajib** | Nama antrean (digunakan sebagai nama store di IndexedDB) |
| `options.maxRetries` | `number` | `3` | Jumlah maksimum percobaan ulang sebelum entri dianggap gagal permanen |
| `options.backoff` | `"linear" \| "exponential"` | `"exponential"` | Strategi jeda antar percobaan ulang |
| `options.backoffBase` | `number` | `1000` | Jeda dasar (ms) untuk kalkulasi backoff |
| `options.onSyncSuccess` | `(entry: SyncEntry) => void` | — | Callback saat entri berhasil disinkronisasi |
| `options.onSyncFailure` | `(entry: SyncEntry, error: Error) => void` | — | Callback saat entri gagal (setelah melampaui maxRetries) |

### Return (`UseBackgroundSyncReturn`)

| Properti | Tipe | Keterangan |
|---|---|---|
| `queue` | `Readonly<Ref<SyncEntry[]>>` | Seluruh entri dalam antrean (reaktif) |
| `pendingCount` | `Readonly<Ref<number>>` | Jumlah entri yang masih pending |
| `enqueue(entry)` | `(entry) => Promise<string>` | Menambah entri ke antrean; mengembalikan ID |
| `flush()` | `() => Promise<void>` | Memproses seluruh entri pending |
| `remove(id)` | `(id: string) => Promise<boolean>` | Menghapus entri tertentu |
| `clear()` | `() => Promise<void>` | Menghapus seluruh entri dalam antrean |

### `SyncEntry`

```ts
interface SyncEntry {
  id: string;               // UUID (dibangkitkan otomatis)
  url: string;              // URL permintaan
  method: string;           // HTTP method (GET, POST, PUT, DELETE)
  body?: unknown;           // Body permintaan (diserialisasi ke JSON)
  headers?: Record<string, string>;  // Header kustom
  idempotencyKey?: string;  // Key untuk deduplikasi (dibangkitkan otomatis)
  createdAt: number;        // Timestamp pembuatan (epoch ms)
  retryCount: number;       // Jumlah percobaan ulang yang telah dilakukan
}
```

---

## 2. Contoh Penggunaan

### Dasar — Mengantrekan Submit Form saat Offline

```vue
<script setup lang="ts">
import { useBackgroundSync } from "pwa-modular-library";

const { pendingCount, enqueue } = useBackgroundSync("exam-answers", {
  maxRetries: 5,
  onSyncSuccess: (entry) => {
    console.log("Berhasil sinkron:", entry.id);
  },
  onSyncFailure: (entry, error) => {
    console.error("Gagal sinkron:", entry.id, error);
  },
});

async function submitAnswer(data: Record<string, unknown>) {
  const id = await enqueue({
    url: "/api/exams/submit",
    method: "POST",
    body: data,
  });
  console.log("Entri diantrekan:", id);
  // pendingCount.value akan bertambah
}
</script>

<template>
  <div>
    <p v-if="pendingCount > 0">
      {{ pendingCount }} permintaan menunggu sinkronisasi
    </p>
    <button @click="submitAnswer({ examId: 1 })">Submit</button>
  </div>
</template>
```

### Flush Manual + Clear

```ts
const { pendingCount, flush, clear } = useBackgroundSync("orders");

// Dipicu manual
await flush();

// Hapus semua entri
await clear();
```

### Header Kustom & Idempotency

```ts
await enqueue({
  url: "/api/order",
  method: "POST",
  body: { productId: 42 },
  headers: {
    "Authorization": "Bearer token-xxx",
    "X-Custom-Header": "value",
  },
  // idempotencyKey opsional; library akan membangkitkan UUID jika tidak diisi
  idempotencyKey: "order-42-v2",
});
```

---

## 3. Cara Kerja

1. **Enqueue**: Entri ditulis ke IndexedDB dengan status `pending`.
2. **Flush otomatis**: Saat browser online (`navigator.onLine === true`), seluruh entri pending dikirim secara otomatis.
3. **Retry**: Jika permintaan gagal (galat jaringan / respons non-2xx), entri dicoba ulang setelah jeda sesuai strategi backoff.
4. **Exponential backoff**: `delay = backoffBase × 2^retryCount` (default). Linear: `delay = backoffBase × retryCount`.
5. **Max retries**: Setelah `retryCount >= maxRetries`, status entri menjadi `failed` dan `onSyncFailure` dipanggil.
6. **Idempotency**: Header `Idempotency-Key` disertakan pada setiap permintaan untuk deduplikasi di sisi server.
7. **FIFO**: Entri diproses sesuai urutan `createdAt` (First In, First Out).

---

## 4. Dukungan Browser

Background Sync API didukung pada Chrome 49+, Edge 79+, Samsung Internet 4.0+.

**Firefox dan Safari tidak mendukung Background Sync API.** Library tetap berfungsi: entri disimpan di IDB dan dikirim saat browser kembali online, namun tanpa Background Sync API native (hanya mengandalkan event `navigator.onLine`).

---

## 5. Catatan

- Setiap antrean terisolasi berdasarkan `queueName` — beberapa antrean dapat digunakan dalam satu aplikasi.
- Antrean disimpan di IndexedDB (database `sabil-pwa-library`, store `sync-queues`) dan bertahan setelah pemuatan ulang halaman.
- `flush()` hanya memproses entri dengan status `pending`. Entri `failed` tidak ikut dikirim.
- Idempotency key dibangkitkan otomatis (UUID v4) jika tidak diisi manual. Server harus menangani header `Idempotency-Key` untuk deduplikasi.
