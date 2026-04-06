# 🚀 PWA Modular Library (Vue 3 + TypeScript)

Library modular untuk mempercepat pengembangan **Progressive Web Apps (PWA)** berbasis Vue 3 dan TypeScript.

Dirancang dengan pendekatan **modular architecture**, library ini menyediakan abstraction layer untuk fitur inti PWA seperti caching, storage, background sync, notification, dan service worker.

---

## ✨ Features

- ⚡ Modular architecture (plug & play)
- 📦 Cache strategies (Cache First, Network First, SWR)
- 💾 IndexedDB storage abstraction
- 🔄 Background sync queue
- 🔔 Notification API wrapper
- ⚙️ Service Worker manager
- 🧠 Capability detection
- 🧪 Fully tested (Vitest)

---

## 📦 Installation

```bash
npm install pwa-modular-library
```

---

## 🚀 Quick Start

```ts
import { createPWA } from "pwa-modular-library";

const pwa = createPWA({
  serviceWorker: {
    enabled: true,
    url: "/service-worker.js",
  },
  notification: {
    requestPermissionOnInit: true,
  },
});

// Cache
await pwa.cache.set("key", new Response("data"));

// Storage
await pwa.storage.set("user", { name: "Usbul" });

// Sync
await pwa.sync.add({
  id: "task-1",
  payload: { data: 123 },
});

// Notification
await pwa.notification.show("Hello", {
  body: "Welcome back!",
});

// Service Worker
await pwa.serviceWorker.register();
```

---

## 🧩 Architecture

Library terdiri dari beberapa module utama:

- Core Module
- Cache Module
- Storage Module
- Sync Module
- Notification Module
- Service Worker Module

---

## ⚙️ Configuration

```ts
createPWA({
  serviceWorker: {
    enabled: true,
    url: "/sw.js",
  },
  cache: {
    defaultCacheName: "app-cache",
  },
  storage: {
    dbName: "app-db",
    storeName: "app-store",
  },
  sync: {
    maxRetries: 3,
    retryDelay: 1000,
  },
  notification: {
    requestPermissionOnInit: true,
  },
});
```

---

## 🧪 Testing

```bash
npm run test
```

---

## 📚 Documentation

Lihat folder `/docs` untuk dokumentasi lengkap tiap module.

---

## 🎯 Use Case

Library ini digunakan dalam studi kasus:

> Sistem Ujian Online berbasis PWA
> dengan dukungan offline mode, sync, dan caching.

---

## 🧑‍💻 Author

Developed by Usbul 🚀

---

## 📄 License

MIT
