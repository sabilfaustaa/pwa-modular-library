# Contoh: Install Prompt (A2HS)

Demo `useInstallPrompt` — orkestrasi *Add to Home Screen*. Composable menangkap event `beforeinstallprompt`, memaparkan state reaktif (`isSupported`, `isInstalled`, `canPrompt`), dan menyediakan `prompt()` untuk memunculkan dialog instalasi.

## Demo

<ClientOnly>
  <InstallPromptDemo />
</ClientOnly>

## Cara mencoba

1. **Amati badge** — di lingkungan docs, `canPrompt` umumnya `false`; demo menjelaskan alasannya (kriteria PWA belum terpenuhi di situs ini).
2. **Coba di aplikasi nyata** — jalankan aplikasi PWA-mu (HTTPS + manifest valid + SW aktif) di Chrome/Edge; saat `beforeinstallprompt` tertangkap, `canPrompt` menjadi `true` dan tombol aktif.
3. **Klik Install** — hasil `prompt()` (`accepted` / `dismissed` / `unavailable`) tampil beserta penjelasannya; prompt hangus setelah sekali dipakai.

## Kode sumber

```vue
<script setup lang="ts">
import { ref } from "vue";
import { useInstallPrompt } from "pwa-modular-library";

const { isSupported, isInstalled, canPrompt, prompt } = useInstallPrompt();
const lastResult = ref<string | null>(null);

async function handleInstall() {
  lastResult.value = await prompt(); // "accepted" | "dismissed" | "unavailable"
}
</script>

<template>
  <button :disabled="!canPrompt" @click="handleInstall">
    Install Aplikasi
  </button>
</template>
```

## Catatan

- Event `beforeinstallprompt` hanya dipicu peramban (umumnya Chromium) saat kriteria PWA terpenuhi: HTTPS, manifest valid, dan service worker aktif. Karena itu `canPrompt` bisa `false` di lingkungan dokumentasi ini.
- Pada Safari/iOS yang tidak mendukung prompt programatik, `isSupported` bernilai `false` dan instalasi dilakukan manual lewat menu *Share → Add to Home Screen*.

Lihat dokumentasi API lengkap di [useInstallPrompt](/install-prompt).
