# Notification Module

Wrapper untuk Notification API.

## Fitur

- request permission
- show notification

## Contoh

```ts
await pwa.notification.requestPermission();

await pwa.notification.show("Hello", {
  body: "Message",
});
```

---
