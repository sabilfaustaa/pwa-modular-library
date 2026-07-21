<script setup lang="ts">
import { ref, watch } from "vue";
import { usePWA } from "pwa-modular-library";

const log = ref<string[]>([]);
function note(msg: string): void {
  log.value = [`${new Date().toLocaleTimeString()} — ${msg}`, ...log.value].slice(0, 6);
}

// swPath menunjuk ke /sw.js no-op yang disediakan situs docs (docs/public/sw.js).
const { isRegistered, hasUpdate, isOnline, update, unregister } = usePWA({
  swPath: "/sw.js",
  autoUpdate: false,
  onRegistered: (reg) => note(`✓ SW terdaftar (scope: ${reg.scope})`),
  onUpdateAvailable: () => note("🔄 versi SW baru terdeteksi — menunggu konfirmasi"),
  onError: (err) => note(`✗ registrasi gagal: ${err.message}`),
});

watch(isOnline, (online) => note(online ? "🌐 kembali online" : "📴 koneksi terputus"));

async function checkUpdate(): Promise<void> {
  note("memeriksa update SW…");
  try {
    await update();
  } catch (err) {
    note(`✗ gagal memeriksa update: ${err instanceof Error ? err.message : String(err)}`);
  }
}

async function doUnregister(): Promise<void> {
  const ok = await unregister();
  note(ok ? "SW di-unregister — muat ulang halaman untuk mendaftar lagi" : "tidak ada SW untuk di-unregister");
}
</script>

<template>
  <div class="demo-card">
    <div class="demo-badges">
      <span class="badge" :class="isOnline ? 'on' : 'warn'">isOnline: {{ isOnline }}</span>
      <span class="badge" :class="isRegistered ? 'on' : 'off'">isRegistered: {{ isRegistered }}</span>
      <span class="badge" :class="hasUpdate ? 'warn' : 'off'">hasUpdate: {{ hasUpdate }}</span>
    </div>

    <div class="demo-row">
      <button class="demo-btn" @click="checkUpdate">🔄 Periksa Update</button>
      <button class="demo-btn secondary" @click="doUnregister">Unregister SW</button>
    </div>

    <h4>Log peristiwa</h4>
    <ul v-if="log.length" class="demo-list">
      <li v-for="(l, i) in log" :key="i"><span>{{ l }}</span></li>
    </ul>
    <p v-else class="demo-empty">Belum ada aktivitas.</p>

    <p class="demo-note">
      Coba matikan jaringan (DevTools → Network → Offline) untuk melihat <code>isOnline</code> berubah
      secara reaktif — perubahan juga tercatat di log. Situs docs menyertakan <code>/sw.js</code> no-op
      agar <code>isRegistered</code> menjadi <code>true</code> tanpa meng-cache apa pun. Dengan
      <code>autoUpdate: false</code>, SW baru menunggu konfirmasi — <code>update()</code> setara tombol
      "Perbarui" pada aplikasi nyata.
    </p>
  </div>
</template>
