# Contoh: Form Offline + Antrean Sync

Demo `useBackgroundSync` — antrean request luring (offline queue). Submit saat offline, lihat antrean reaktif, lalu auto-flush dengan backoff saat koneksi pulih.

## Demo

<ClientOnly>
  <BackgroundSyncDemo />
</ClientOnly>

## Kode sumber

```vue
<script setup lang="ts">
import { useBackgroundSync } from "pwa-modular-library";

const { queue, pendingCount, enqueue, flush } = useBackgroundSync("guestbook", {
  backoff: "exponential",
  baseDelayMs: 1500,
  onSyncSuccess: (e) => console.log("terkirim:", e.id),
});

async function submit(message: string) {
  await enqueue({ url: "/api/guestbook", method: "POST", body: { message } });
  // otomatis ter-flush saat online; gagal → retry dengan backoff
}
</script>
```

> Demo memakai endpoint publik `jsonplaceholder.typicode.com/posts` (ramah CORS, mengembalikan 201). Lihat dokumentasi API lengkap di [useBackgroundSync](/sync).
