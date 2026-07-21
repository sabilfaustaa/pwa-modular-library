<script setup lang="ts">
import { ref } from "vue";
import { useInstallPrompt } from "pwa-modular-library";

const { isSupported, isInstalled, canPrompt, prompt } = useInstallPrompt();
const lastResult = ref<string | null>(null);

async function handleInstall(): Promise<void> {
  lastResult.value = await prompt();
}
</script>

<template>
  <div class="demo-card">
    <div class="demo-badges">
      <span class="badge" :class="isSupported ? 'on' : 'off'">isSupported: {{ isSupported }}</span>
      <span class="badge" :class="isInstalled ? 'on' : 'off'">isInstalled: {{ isInstalled }}</span>
      <span class="badge" :class="canPrompt ? 'on' : 'off'">canPrompt: {{ canPrompt }}</span>
    </div>

    <div class="demo-row">
      <button class="demo-btn" :disabled="!canPrompt" @click="handleInstall">📲 Install Aplikasi</button>
    </div>

    <p v-if="!isSupported" class="demo-note">
      Browser ini belum mendukung prompt instalasi (A2HS). Komponen tetap aman ditampilkan.
    </p>
    <p v-else-if="!canPrompt" class="demo-note">
      Prompt belum siap. Event <code>beforeinstallprompt</code> hanya muncul saat kriteria PWA terpenuhi
      (HTTPS, manifest valid, service worker aktif).
    </p>
    <p v-if="lastResult" class="demo-result">
      Hasil prompt terakhir: <strong>{{ lastResult }}</strong>
      <template v-if="lastResult === 'accepted'"> — user menyetujui instalasi.</template>
      <template v-else-if="lastResult === 'dismissed'">
        — user menutup dialog. Prompt hangus setelah sekali dipakai; browser perlu memicu ulang
        <code>beforeinstallprompt</code>.
      </template>
      <template v-else> — prompt tidak tersedia (belum ada deferred prompt yang tertangkap).</template>
    </p>
  </div>
</template>
