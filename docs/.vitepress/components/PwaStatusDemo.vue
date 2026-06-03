<script setup lang="ts">
import { usePWA } from "pwa-modular-library";

// swPath menunjuk ke /sw.js no-op yang disediakan situs docs (docs/public/sw.js).
const { isRegistered, hasUpdate, isOnline, update, unregister } = usePWA({
  swPath: "/sw.js",
  autoUpdate: false,
});
</script>

<template>
  <div class="demo-card">
    <div class="demo-badges">
      <span class="badge" :class="isOnline ? 'on' : 'warn'">isOnline: {{ isOnline }}</span>
      <span class="badge" :class="isRegistered ? 'on' : 'off'">isRegistered: {{ isRegistered }}</span>
      <span class="badge" :class="hasUpdate ? 'warn' : 'off'">hasUpdate: {{ hasUpdate }}</span>
    </div>

    <div class="demo-row">
      <button class="demo-btn" @click="update">🔄 Periksa Update</button>
      <button class="demo-btn secondary" @click="unregister">Unregister SW</button>
    </div>

    <p class="demo-note">
      Coba matikan jaringan (DevTools → Network → Offline) untuk melihat <code>isOnline</code> berubah
      secara reaktif. Situs docs menyertakan <code>/sw.js</code> no-op agar <code>isRegistered</code>
      menjadi <code>true</code> tanpa meng-cache apa pun.
    </p>
  </div>
</template>
