# Contoh: Notification Playground

Demo `useNotifications` — minta izin lalu tampilkan notifikasi lokal. Susun judul & isi, lalu kirim.

## Demo

<ClientOnly>
  <NotificationsDemo />
</ClientOnly>

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
