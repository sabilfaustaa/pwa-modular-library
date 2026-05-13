# Matriks Dukungan Browser

Library ini menggunakan pendekatan **progressive enhancement** — fitur yang tidak didukung browser akan fail gracefully (boolean flag `isSupported`), bukan melempar error.

---

## 1. Fitur & Browser

| Fitur | Chrome | Edge | Firefox | Safari | Samsung Internet |
|---|---|---|---|---|---|
| **Service Worker** | ✅ 45+ | ✅ 79+ | ✅ 44+ | ✅ 11.1+ | ✅ 4.0+ |
| **Cache API** | ✅ 43+ | ✅ 79+ | ✅ 41+ | ✅ 11.1+ | ✅ 4.0+ |
| **IndexedDB** | ✅ 24+ | ✅ 79+ | ✅ 16+ | ✅ 10+ | ✅ 1.5+ |
| **Push API** | ✅ 42+ | ✅ 79+ | ✅ 44+ | ✅ 16.0+¹ | ✅ 4.0+ |
| **Notification API** | ✅ 20+ | ✅ 79+ | ✅ 22+ | ✅ 7+ | ✅ 1.2+ |
| **Background Sync** | ✅ 49+ | ✅ 79+ | ❌ | ❌ | ✅ 4.0+ |
| **BeforeInstallPrompt** | ✅ 45+ | ✅ 79+ | ❌ | ❌ | ✅ 4.0+ |

¹ Safari Push: hanya didukung pada macOS (bukan iOS). Safari iOS 16.4+ mendukung Push melalui Web Push API yang terbatas.

---

## 2. Deteksi Fitur di Library

Gunakan `checkCapabilities()` untuk mendeteksi seluruh fitur dalam satu panggilan:

```ts
import { checkCapabilities } from "pwa-modular-library";

const caps = checkCapabilities();
// caps.serviceWorker    → boolean
// caps.indexedDB        → boolean
// caps.notifications    → boolean
// caps.cacheAPI         → boolean
// caps.backgroundSync   → boolean
// caps.pushManager      → boolean
// caps.installPrompt    → boolean
```

Atau langsung periksa pada nilai kembalian composable:

```ts
const { isSupported } = useNotifications();
if (!isSupported.value) {
  console.warn("Notification API tidak didukung pada browser ini");
}
```

---

## 3. Perilaku Cadangan (Fallback)

| Skenario | Perilaku Library |
|---|---|
| Browser tidak mendukung SW | `usePWA().isRegistered` tetap `false`, `onError` dipanggil |
| Browser tidak mendukung Cache API | `useCacheConfig().rules` kosong, `addRule` tetap berfungsi (in-memory, tidak sinkron ke SW) |
| Browser tidak mendukung Notification | `useNotifications().permission === 'unsupported'` |
| Browser tidak mendukung Push | `useNotifications().isSupported === false`, `subscribe()` mengembalikan `null` |
| Browser tidak mendukung Background Sync | `useBackgroundSync().enqueue()` tetap menulis ke IDB (antrean tersimpan lokal) |
| Browser tidak mendukung BeforeInstallPrompt | `useInstallPrompt().isSupported === false`, `prompt()` mengembalikan `'unavailable'` |

---

## 4. Referensi

- [Can I Use — Service Worker](https://caniuse.com/serviceworkers)
- [Can I Use — Push API](https://caniuse.com/push-api)
- [Can I Use — Web App Manifest](https://caniuse.com/web-app-manifest)
- [MDN — BeforeInstallPromptEvent](https://developer.mozilla.org/en-US/docs/Web/API/BeforeInstallPromptEvent)
