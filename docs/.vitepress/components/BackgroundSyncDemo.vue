<script setup lang="ts">
import { ref } from "vue";
import { useBackgroundSync } from "pwa-modular-library";

// Endpoint demo publik yang menerima POST & ramah-CORS.
const ENDPOINT = "https://jsonplaceholder.typicode.com/posts";

const log = ref<string[]>([]);
function note(msg: string): void {
  log.value = [`${new Date().toLocaleTimeString()} — ${msg}`, ...log.value].slice(0, 6);
}

const { queue, pendingCount, enqueue, flush, clear } = useBackgroundSync("docs-guestbook", {
  backoff: "exponential",
  baseDelayMs: 1500,
  onSyncSuccess: (e) => note(`✓ terkirim: ${e.id.slice(0, 8)}`),
  onSyncFailure: (e, err) => note(`✗ gagal final: ${e.id.slice(0, 8)} (${err.message})`),
});

const message = ref("Halo dari antrean offline!");

async function submit(): Promise<void> {
  const id = await enqueue({ url: ENDPOINT, method: "POST", body: { message: message.value } });
  note(`+ antri: ${id.slice(0, 8)}`);
}
</script>

<template>
  <div class="demo-card">
    <p class="demo-note">
      Matikan jaringan (DevTools → Offline), klik <em>Kirim</em> beberapa kali, lalu nyalakan lagi —
      antrean otomatis ter-flush dengan backoff. Online pun bisa langsung mencoba.
    </p>

    <input class="demo-input" v-model="message" placeholder="Pesan" />
    <div class="demo-row">
      <button class="demo-btn" @click="submit">Kirim (antri)</button>
      <button class="demo-btn secondary" @click="flush">Flush sekarang</button>
      <button class="demo-btn secondary" @click="clear">Kosongkan</button>
      <span class="badge on">pending: {{ pendingCount }}</span>
    </div>

    <h4>Isi antrean</h4>
    <ul v-if="queue.length" class="demo-list">
      <li v-for="e in queue" :key="e.id">
        <span>{{ e.method }} {{ e.url.replace('https://jsonplaceholder.typicode.com', '') }}</span>
        <span>retry: {{ e.retryCount }}</span>
      </li>
    </ul>
    <p v-else class="demo-empty">Antrean kosong.</p>

    <h4>Log</h4>
    <ul v-if="log.length" class="demo-list">
      <li v-for="(l, i) in log" :key="i"><span>{{ l }}</span></li>
    </ul>
    <p v-else class="demo-empty">Belum ada aktivitas.</p>
  </div>
</template>
