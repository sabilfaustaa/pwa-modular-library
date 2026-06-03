# Contoh: Install Prompt (A2HS)

Demo `useInstallPrompt` — orkestrasi *Add to Home Screen*. Composable menangkap event `beforeinstallprompt`, memaparkan state reaktif (`isSupported`, `isInstalled`, `canPrompt`), dan menyediakan `prompt()` untuk memunculkan dialog instalasi.

## Demo

<ClientOnly>
  <InstallPromptDemo />
</ClientOnly>

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
