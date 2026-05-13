# Install Prompt — `useInstallPrompt()`

Composable `useInstallPrompt()` menangkap event `beforeinstallprompt` dari browser (Chrome/Edge/Samsung Internet) dan menyediakan API untuk menampilkan dialog kustom "Add to Home Screen".

---

## 1. API

```ts
import { useInstallPrompt } from "pwa-modular-library";

const { isSupported, isInstalled, canPrompt, prompt } = useInstallPrompt();
```

### Return (`UseInstallPromptReturn`)

| Properti | Tipe | Keterangan |
|---|---|---|
| `isSupported` | `Readonly<Ref<boolean>>` | `true` jika browser pernah memicu `beforeinstallprompt` pada sesi ini |
| `isInstalled` | `Readonly<Ref<boolean>>` | `true` jika aplikasi berjalan dalam mode standalone/installed |
| `canPrompt` | `Readonly<Ref<boolean>>` | `true` jika deferred prompt tersedia dan siap dipanggil |
| `prompt()` | `() => Promise<"accepted" \| "dismissed" \| "unavailable">` | Menampilkan dialog install; mengembalikan hasil pilihan pengguna |

---

## 2. Contoh Penggunaan

### Dasar — Tombol Install Kustom

```vue
<script setup lang="ts">
import { useInstallPrompt } from "pwa-modular-library";

const { isSupported, isInstalled, canPrompt, prompt } = useInstallPrompt();

async function handleInstall() {
  const result = await prompt();
  if (result === "accepted") {
    console.log("Pengguna memasang aplikasi!");
    // canPrompt otomatis menjadi false
  } else if (result === "dismissed") {
    console.log("Pengguna menolak install");
    // Prompt hanya dapat digunakan sekali per sesi — perlu memuat ulang halaman
  }
}
</script>

<template>
  <div>
    <p v-if="isInstalled">✅ Aplikasi sudah terpasang</p>
    <p v-else-if="!isSupported">📱 Browser tidak mendukung install prompt</p>
    <button v-else-if="canPrompt" @click="handleInstall">
      Pasang Aplikasi
    </button>
    <p v-else>🔄 Prompt belum tersedia — coba muat ulang halaman</p>
  </div>
</template>
```

### Deteksi Status Pemasangan

```ts
const { isInstalled } = useInstallPrompt();

// Reaktif — berubah saat event 'appinstalled' dipicu
// atau saat display-mode berubah (misalnya pengguna meng-uninstall melalui OS)
watch(isInstalled, (installed) => {
  if (installed) {
    console.log("Aplikasi terpasang!");
  }
});
```

---

## 3. Cara Kerja

1. **Menangkap event**: Library mendengarkan event `beforeinstallprompt` pada `window`. Event ini hanya dipicu oleh browser berbasis Chromium (Chrome, Edge, Samsung Internet) saat PWA memenuhi kriteria installability.
2. **Deferred prompt**: Prompt disimpan; `preventDefault()` dipanggil agar dialog bawaan browser tidak muncul secara otomatis.
3. **`prompt()`**: Memanggil `deferredPrompt.prompt()` untuk menampilkan dialog. Hanya dapat dipanggil **sekali** — setelah itu prompt hangus.
4. **Deteksi installed**: Memeriksa `matchMedia('(display-mode: standalone)')` dan mendengarkan event `appinstalled`.
5. **Pembersihan**: Seluruh listener dilepas saat komponen Vue di-unmount melalui `onUnmounted`.

---

## 4. Dukungan Browser

`beforeinstallprompt` hanya didukung pada **browser berbasis Chromium**: Chrome 45+, Edge 79+, Samsung Internet 4.0+.

| Browser | `beforeinstallprompt` | Event `appinstalled` | Keterangan |
|---|---|---|---|
| Chrome 45+ | ✅ | ✅ | Dukungan penuh |
| Edge 79+ | ✅ | ✅ | Dukungan penuh |
| Firefox | ❌ | ❌ | Tidak mendukung prompt Add to Home Screen |
| Safari | ❌ | ❌ | Tidak didukung; gunakan instruksi manual |
| Samsung Internet 4.0+ | ✅ | ✅ | Dukungan penuh |

---

## 5. Catatan

- Prompt hanya dapat dipanggil **sekali per sesi**. Setelah `prompt()` dipanggil (diterima atau ditolak pengguna), deferred prompt hangus. Pengguna harus memuat ulang halaman untuk memunculkannya kembali.
- `isSupported` menjadi `true` hanya setelah event `beforeinstallprompt` dipicu. Hal ini dapat memerlukan beberapa detik setelah halaman dimuat.
- `isInstalled` menggunakan CSS media query `(display-mode: standalone)` sebagai mekanisme deteksi yang paling andal lintas browser.
- Firefox dan Safari tidak mendukung install prompt. Sediakan instruksi manual sebagai cadangan (misalnya "Buka menu browser → Add to Home Screen").
