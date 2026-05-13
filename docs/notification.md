# Notifikasi — `useNotifications()`

Composable `useNotifications()` untuk mengelola izin notifikasi, push subscription (VAPID), dan notifikasi lokal. Status reaktif (`permission`, `isSubscribed`, `isSupported`) diperbarui secara otomatis.

---

## 1. API

```ts
import { useNotifications } from "pwa-modular-library";

const {
  permission,
  isSupported,
  isSubscribed,
  requestPermission,
  subscribe,
  unsubscribe,
  show,
} = useNotifications(options?);
```

### Options (`UseNotificationsOptions`)

| Properti | Tipe | Default | Keterangan |
|---|---|---|---|
| `vapidPublicKey` | `string` | — | VAPID public key (base64url) untuk push subscription |
| `subscriptionEndpoint` | `string` | — | URL endpoint server untuk menyimpan subscription (POST/DELETE) |
| `appName` | `string` | `"PWA App"` | Nama aplikasi sebagai fallback pada `new Notification()` |

### Return (`UseNotificationsReturn`)

| Properti | Tipe | Keterangan |
|---|---|---|
| `permission` | `Readonly<Ref<PermissionStatus>>` | Status izin: `"granted"`, `"denied"`, `"default"`, `"unsupported"` |
| `isSupported` | `Readonly<Ref<boolean>>` | Apakah Notification API didukung browser |
| `isSubscribed` | `Readonly<Ref<boolean>>` | Apakah pengguna telah melakukan subscribe push |
| `requestPermission()` | `() => Promise<PermissionStatus>` | Meminta izin notifikasi; mengembalikan status terbaru |
| `subscribe()` | `() => Promise<PushSubscription \| null>` | Melakukan subscribe push dengan VAPID + POST ke endpoint; mengembalikan subscription |
| `unsubscribe()` | `() => Promise<boolean>` | Melakukan unsubscribe push + DELETE ke endpoint |
| `show(payload)` | `(payload: NotificationPayload) => Promise<void>` | Menampilkan notifikasi lokal |

### `NotificationPayload`

```ts
interface NotificationPayload {
  title: string;
  body?: string;
  icon?: string;
  image?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
  actions?: { action: string; title: string; icon?: string }[];
}
```

---

## 2. Contoh Penggunaan

### Dasar — Izin + Notifikasi Lokal

```vue
<script setup lang="ts">
import { useNotifications } from "pwa-modular-library";

const { permission, requestPermission, show } = useNotifications();

async function handleNotify() {
  if (permission.value !== "granted") {
    await requestPermission();
  }
  await show({
    title: "Halo!",
    body: "Ini notifikasi dari PWA.",
    icon: "/icon-192.png",
  });
}
</script>

<template>
  <div>
    <p>Status izin: {{ permission }}</p>
    <button @click="handleNotify" :disabled="permission === 'denied'">
      Tampilkan Notifikasi
    </button>
  </div>
</template>
```

### Push Subscription (VAPID)

```ts
const { isSubscribed, subscribe, unsubscribe } = useNotifications({
  vapidPublicKey: "BDd3_hVL9f3...", // VAPID public key (base64url)
  subscriptionEndpoint: "/api/push/subscribe",
});

// Subscribe
const subscription = await subscribe();
if (subscription) {
  console.log("Subscribed:", subscription.endpoint);
  // isSubscribed.value → true
}

// Unsubscribe
await unsubscribe();
// isSubscribed.value → false
```

### Tanpa VAPID (Notifikasi Lokal Saja)

```ts
const { permission, requestPermission, show } = useNotifications();

// Minta izin
const status = await requestPermission();
console.log(status); // "granted" | "denied" | "default" | "unsupported"

// Tampilkan notifikasi
await show({ title: "Pengingat", body: "Jangan lupa submit!" });
```

---

## 3. Perilaku Cadangan (Fallback)

| Skenario | Perilaku |
|---|---|
| Browser tidak mendukung Notification API | `isSupported === false`, semua method no-op |
| Izin `"denied"` | `requestPermission()` tidak dapat mengubah status; `subscribe()` mengembalikan `null` |
| Tidak ada Service Worker | `show()` fallback ke `new Notification()` (notifikasi non-persistent) |
| VAPID key tidak valid | `subscribe()` akan melempar `PWAError` dengan pesan yang jelas |

---

## 4. Dukungan Browser

- **Notification API**: Chrome 20+, Edge 79+, Firefox 22+, Safari 7+, Samsung Internet 1.2+
- **Push API**: Chrome 42+, Edge 79+, Firefox 44+, Safari 16.0+ (macOS saja), Samsung Internet 4.0+
- Safari iOS 16.4+ mendukung Push melalui Web Push API yang terbatas

---

## 5. Catatan

- `subscribe()` otomatis meminta izin (`requestPermission()`) jika izin belum bernilai `"granted"`.
- `subscriptionEndpoint`: library akan mengirim POST subscription JSON ke endpoint ini setelah `pushManager.subscribe()`. Body: `{ endpoint, keys: { p256dh, auth } }`.
- `unsubscribe()`: library akan mengirim DELETE ke `subscriptionEndpoint/{endpoint}` lalu memanggil `subscription.unsubscribe()`.
- Izin diperiksa (poll) setiap 5 detik sebagai fallback untuk browser yang tidak mendukung event `onchange` pada Permissions API.
