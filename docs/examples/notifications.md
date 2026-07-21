# Contoh: Notification Playground

Demo `useNotifications` — minta izin lalu tampilkan notifikasi lokal. Susun judul & isi, lalu kirim.

## Demo

<ClientOnly>
  <NotificationsDemo />
</ClientOnly>

## Cara mencoba

1. **Minta izin** — klik *Minta Izin*; badge `permission` berubah reaktif mengikuti pilihanmu di dialog browser.
2. **Kirim notifikasi** — setelah `granted`, susun judul & isi lalu klik *Tampilkan Notifikasi*; periksa pojok layar / notification center OS.
3. **Coba blokir** — kalau izin `denied`, demo menampilkan petunjuk pemulihan; ubah izin lewat pengaturan situs (ikon gembok) dan lihat badge ikut berubah tanpa muat ulang.

## Kode sumber

```vue
<script setup lang="ts">
import { ref } from "vue";
import { useNotifications } from "pwa-modular-library";

const { permission, isSupported, requestPermission, show } = useNotifications();
const title = ref("Halo!");
const body = ref("Notifikasi lokal via useNotifications().");

async function send() {
  if (permission.value !== "granted") await requestPermission();
  if (permission.value === "granted") await show({ title: title.value, body: body.value });
}
</script>
```

Lihat dokumentasi API lengkap di [useNotifications](/notification).
