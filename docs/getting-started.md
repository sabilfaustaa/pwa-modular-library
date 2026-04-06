# Getting Started

## Instalasi

```bash
npm install pwa-modular-library
```

## Setup dasar

```ts
import { createPWA } from "pwa-modular-library";

const pwa = createPWA();
```

## Struktur runtime

```ts
pwa = {
  core,
  cache,
  storage,
  sync,
  notification,
  serviceWorker,
};
```

## Flow penggunaan

1. Inisialisasi library
2. Gunakan module sesuai kebutuhan
3. Integrasikan ke aplikasi

---
