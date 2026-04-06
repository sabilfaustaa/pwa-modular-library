# Cache Module

Module untuk mengelola caching berbasis Cache API.

## Fitur

- Cache First
- Network First
- Stale While Revalidate

## Contoh

```ts
await pwa.cache.set("key", response);
const data = await pwa.cache.get("key");
```

## Strategies

```ts
cache.networkFirst(request);
cache.cacheFirst(request);
cache.staleWhileRevalidate(request);
```

---
