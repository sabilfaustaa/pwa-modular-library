---
layout: home

hero:
  name: "PWA Modular Library"
  text: "Progressive Web Apps untuk Vue 3"
  tagline: Library modular & type-safe untuk mempercepat implementasi PWA pada sistem dengan keterbatasan konektivitas.
  actions:
    - theme: brand
      text: Mulai
      link: /getting-started
    - theme: alt
      text: Contoh Interaktif
      link: /examples/
    - theme: alt
      text: Lihat di GitHub
      link: https://github.com/

features:
  - icon: ⚙️
    title: usePWA
    details: Registrasi & lifecycle Service Worker, deteksi update, status online/offline — reaktif.
    link: /service-worker
  - icon: 🗃️
    title: useCacheConfig
    details: Strategi caching deklaratif berbasis rules (5 strategi) yang disinkronkan ke Service Worker.
    link: /cache
  - icon: 🔔
    title: useNotifications
    details: Izin, langganan push, dan tampilan notifikasi dengan penanganan yang aman.
    link: /notification
  - icon: 📥
    title: useBackgroundSync
    details: Antrean request luring (offline queue) dengan auto-retry + backoff saat koneksi pulih.
    link: /sync
  - icon: 📲
    title: useInstallPrompt
    details: Orkestrasi "Add to Home Screen" dengan state instalasi yang reaktif.
    link: /install-prompt
  - icon: 🧩
    title: Utilitas
    details: generateSW (generator service worker) & validateManifest (validasi web app manifest).
    link: /utilities/generate-sw
---

## Kenapa library ini?

Implementasi manual fitur PWA — manajemen Service Worker, strategi caching, antrean sinkronisasi luring — bersifat repetitif dan rentan kesalahan. Library ini mengabstraksi logika tersebut menjadi **composables Vue 3** yang **tree-shakeable**, **type-safe**, dan **fail gracefully** pada browser yang tidak mendukung.

```bash
npm install pwa-modular-library
```

```ts
import { usePWA, useBackgroundSync } from "pwa-modular-library";

const { isOnline, hasUpdate } = usePWA();
const { enqueue, pendingCount } = useBackgroundSync("orders", { backoff: "exponential" });
```
