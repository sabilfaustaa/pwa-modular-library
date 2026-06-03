<script setup lang="ts">
import { ref } from "vue";
import { useNotifications } from "pwa-modular-library";

const { permission, isSupported, requestPermission, show } = useNotifications();

const title = ref("Halo dari PWA Modular Library");
const body = ref("Ini notifikasi lokal yang ditampilkan via useNotifications().");
const info = ref<string | null>(null);

async function ask(): Promise<void> {
  const result = await requestPermission();
  info.value = `Status izin: ${result}`;
}

async function send(): Promise<void> {
  if (permission.value !== "granted") {
    info.value = "Minta izin dulu sebelum menampilkan notifikasi.";
    return;
  }
  await show({ title: title.value, body: body.value });
  info.value = "Notifikasi dikirim.";
}
</script>

<template>
  <div class="demo-card">
    <div class="demo-badges">
      <span class="badge" :class="isSupported ? 'on' : 'off'">isSupported: {{ isSupported }}</span>
      <span class="badge" :class="permission === 'granted' ? 'on' : permission === 'denied' ? 'off' : 'warn'">
        permission: {{ permission }}
      </span>
    </div>

    <input class="demo-input" v-model="title" placeholder="Judul notifikasi" />
    <input class="demo-input" v-model="body" placeholder="Isi notifikasi" />

    <div class="demo-row">
      <button class="demo-btn secondary" :disabled="!isSupported" @click="ask">Minta Izin</button>
      <button class="demo-btn" :disabled="!isSupported || permission !== 'granted'" @click="send">
        🔔 Tampilkan Notifikasi
      </button>
    </div>

    <p v-if="!isSupported" class="demo-note">Browser ini tidak mendukung Notification API.</p>
    <p v-if="info" class="demo-result">{{ info }}</p>
  </div>
</template>
