# Contoh: Form Offline + Antrean Sync

Demo `useBackgroundSync` — antrean request luring (offline queue) berbasis IndexedDB. Submit saat offline, lihat antrean reaktif, lalu auto-flush dengan backoff saat koneksi pulih. Tersedia juga endpoint gagal untuk melihat retry + backoff secara langsung tanpa harus offline.

## Demo

<ClientOnly>
  <BackgroundSyncDemo />
</ClientOnly>

## Cara mencoba

1. **Skenario offline → online** — matikan jaringan (DevTools → Network → Offline), klik *Kirim (antri)* beberapa kali (badge `pending` naik), lalu nyalakan lagi: antrean ter-flush otomatis dan log mencatat `✓ terkirim`.
2. **Skenario retry & backoff** — tetap online, pilih *Endpoint gagal*, lalu kirim: request gagal (error DNS), `retryCount` naik dengan jeda 1,5 dtk lalu 3 dtk, dan gagal final pada percobaan ke-3 (`onSyncFailure` dipanggil).
3. **Persistensi** — antrekan entri saat offline lalu muat ulang halaman: antrean tetap ada, karena disimpan di IndexedDB.

## Kode sumber

```vue
<script setup lang="ts">
import { useBackgroundSync } from "pwa-modular-library";

const { queue, pendingCount, enqueue, flush } = useBackgroundSync("guestbook", {
  maxRetries: 3,
  backoff: "exponential",
  baseDelayMs: 1500,
  onSyncSuccess: (e) => console.log("terkirim:", e.id),
  onSyncFailure: (e, err) => console.error("gagal final:", e.id, err.message),
});

async function submit(message: string) {
  await enqueue({ url: "/api/guestbook", method: "POST", body: { message } });
  // otomatis ter-flush saat online; gagal → retry dengan backoff
}
</script>
```

> Demo memakai endpoint publik `jsonplaceholder.typicode.com/posts` (ramah CORS, mengembalikan 201) dan host `.invalid` untuk simulasi kegagalan. Error jaringan/5xx di-retry; respons 4xx langsung gagal final tanpa retry. Lihat dokumentasi API lengkap di [useBackgroundSync](/sync).
