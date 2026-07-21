<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useBackgroundSync } from "pwa-modular-library";

// Dua skenario endpoint untuk melihat kedua jalur antrean:
//   - sukses: endpoint demo publik yang menerima POST (201).
//   - gagal:  host .invalid → error DNS → retry + backoff hingga maxRetries.
const SCENARIOS = {
  sukses: { label: "Endpoint sukses (201)", url: "https://jsonplaceholder.typicode.com/posts" },
  gagal: { label: "Endpoint gagal — simulasi retry & backoff", url: "https://demo-gagal.invalid/api/posts" },
} as const;
type ScenarioKey = keyof typeof SCENARIOS;

const scenario = ref<ScenarioKey>("sukses");
const message = ref("Halo dari antrean offline!");
const isOnline = ref(true);

const log = ref<string[]>([]);
function note(msg: string): void {
  log.value = [`${new Date().toLocaleTimeString()} — ${msg}`, ...log.value].slice(0, 8);
}

const { queue, pendingCount, enqueue, flush, clear } = useBackgroundSync("docs-guestbook", {
  maxRetries: 3,
  backoff: "exponential",
  baseDelayMs: 1500,
  onSyncSuccess: (e) => note(`✓ terkirim: ${e.id.slice(0, 8)}`),
  onSyncFailure: (e, err) => note(`✗ gagal final setelah ${e.retryCount}× percobaan: ${e.id.slice(0, 8)} (${err.message})`),
});

async function submit(): Promise<void> {
  const id = await enqueue({
    url: SCENARIOS[scenario.value].url,
    method: "POST",
    body: { message: message.value },
  });
  note(`+ antri: ${id.slice(0, 8)} → ${SCENARIOS[scenario.value].label}`);
}

function shortUrl(url: string): string {
  try {
    const u = new URL(url);
    return `${u.hostname}${u.pathname}`;
  } catch {
    return url;
  }
}

function handleOnline(): void {
  isOnline.value = true;
  note("🌐 koneksi pulih — antrean di-flush otomatis");
}
function handleOffline(): void {
  isOnline.value = false;
  note("📴 offline — request baru akan mengantre");
}

onMounted(() => {
  isOnline.value = navigator.onLine;
  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);
});
onUnmounted(() => {
  window.removeEventListener("online", handleOnline);
  window.removeEventListener("offline", handleOffline);
});
</script>

<template>
  <div class="demo-card">
    <p class="demo-note">
      <strong>Skenario A (offline):</strong> matikan jaringan (DevTools → Network → Offline), klik
      <em>Kirim</em> beberapa kali, nyalakan lagi — antrean ter-flush otomatis.
      <strong>Skenario B (retry):</strong> tetap online, pilih <em>endpoint gagal</em> — perhatikan
      <code>retryCount</code> naik dengan jeda backoff eksponensial (1,5 dtk lalu 3 dtk) hingga gagal
      final pada percobaan ke-3.
    </p>

    <div class="demo-badges">
      <span class="badge" :class="isOnline ? 'on' : 'warn'">{{ isOnline ? "🌐 online" : "📴 offline" }}</span>
      <span class="badge" :class="pendingCount > 0 ? 'warn' : 'off'">pending: {{ pendingCount }}</span>
    </div>

    <div class="demo-row">
      <input class="demo-input" style="flex: 1 1 10rem" v-model="message" placeholder="Pesan" />
      <select class="demo-input" style="flex: 0 1 auto; width: auto" v-model="scenario">
        <option v-for="(s, key) in SCENARIOS" :key="key" :value="key">{{ s.label }}</option>
      </select>
    </div>
    <div class="demo-row">
      <button class="demo-btn" @click="submit">Kirim (antri)</button>
      <button class="demo-btn secondary" @click="flush">Flush sekarang</button>
      <button class="demo-btn secondary" @click="clear">Kosongkan</button>
    </div>

    <h4>Isi antrean</h4>
    <ul v-if="queue.length" class="demo-list">
      <li v-for="e in queue" :key="e.id">
        <span>
          {{ e.method }} {{ shortUrl(e.url) }}
          <em class="demo-dim">· {{ new Date(e.createdAt).toLocaleTimeString() }}</em>
        </span>
        <span class="badge" :class="e.retryCount > 0 ? 'warn' : 'off'">retry: {{ e.retryCount }}</span>
      </li>
    </ul>
    <p v-else class="demo-empty">Antrean kosong — semua terkirim atau belum ada yang diantrekan.</p>

    <h4>Log</h4>
    <ul v-if="log.length" class="demo-list">
      <li v-for="(l, i) in log" :key="i"><span>{{ l }}</span></li>
    </ul>
    <p v-else class="demo-empty">Belum ada aktivitas.</p>

    <p class="demo-note">
      Antrean disimpan di <strong>IndexedDB</strong>, jadi entri pending bertahan melewati muat ulang
      halaman. Error jaringan/5xx di-retry dengan backoff; respons 4xx langsung gagal final (tidak
      di-retry). Setiap request membawa header <code>Idempotency-Key</code> untuk mencegah duplikasi.
    </p>
  </div>
</template>
