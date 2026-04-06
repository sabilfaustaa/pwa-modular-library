# Sync Module

Queue system untuk background sync.

## Fitur

- retry mechanism
- queue processing

## Contoh

```ts
await pwa.sync.add({
  id: "task-1",
  payload: { data: 123 },
});
```

---
