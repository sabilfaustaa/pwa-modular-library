# Storage Module

Wrapper untuk IndexedDB.

## Fitur

- get
- set
- delete
- clear
- getAll

## Contoh

```ts
await pwa.storage.set("user", { name: "Usbul" });
const user = await pwa.storage.get("user");
```

---
