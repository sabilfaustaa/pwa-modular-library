# 🚀 Modular PWA Library

A modular Progressive Web App (PWA) library built with TypeScript, designed to simplify caching, storage, and background synchronization through a unified and scalable architecture.

---

## ✨ Features

- 🧩 Modular architecture (cache, storage, sync)
- ⚙️ Centralized configuration via Core Module
- 📦 IndexedDB storage abstraction
- 🔄 Background sync queue with retry mechanism
- 🌐 Advanced caching strategies:
  - Cache First
  - Network First
  - Stale While Revalidate

- 🧠 Capability detection (browser support)
- 🏗️ Unified API via `createPWA()`

---

## 📦 Installation

```bash
npm install pwa-modular-library
```

> (Temporary: local development build)

---

## 🚀 Quick Start

### Initialize PWA Runtime

```ts
import { createPWA } from "pwa-modular-library";

const pwa = createPWA({
  cache: {
    cacheName: "app-cache",
  },
  storage: {
    dbName: "app-db",
    storeName: "store",
  },
  sync: {
    maxRetries: 5,
    retryDelay: 2000,
  },
});
```

---

### Use Modules

```ts
// Cache
await pwa.cache.fetchWithStrategy("/api/data");

// Storage
await pwa.storage.set("key", { value: 123 });

// Sync
pwa.sync.enqueue({
  id: "task-1",
  payload: { foo: "bar" },
});
```

---

## 🧱 Architecture Overview

```
CoreModule
 ├── Cache Module
 ├── Storage Module (IndexedDB)
 ├── Sync Module
 └── Capability Module
```

All modules are:

- Independently usable
- Configurable
- Integrated via unified factory (`createPWA`)

---

## ⚙️ Configuration

```ts
createPWA({
  cache: {
    cacheName: "custom-cache",
    defaultStrategy: "network-first",
  },
  storage: {
    dbName: "my-db",
    storeName: "my-store",
  },
  sync: {
    maxRetries: 3,
    retryDelay: 1000,
  },
});
```

---

## 🧪 Testing

```bash
npm run test
```

Includes:

- Core module tests
- Cache strategies tests
- Storage (IndexedDB) tests
- Sync queue tests

---

## 📌 Current Status

🚧 In Active Development

### Completed

- Core Module
- Cache Module
- Storage Module
- Sync Module
- Config Integration
- Unified API (`createPWA`)

### Upcoming

- 🔔 Notification Manager
- ⚙️ Service Worker Manager
- 📚 Full Documentation
- 🔌 Vue Plugin Integration

---

## 🎯 Use Case

Designed for:

- Offline-first applications
- Progressive Web Apps (PWA)
- Modular frontend architecture
- Systems requiring reliable data sync (e.g., online exam systems)

---

## 🧠 Design Philosophy

- **Modular First**
- **Config Driven**
- **Framework Agnostic**
- **Scalable Architecture**

---

## 📄 License

MIT License
