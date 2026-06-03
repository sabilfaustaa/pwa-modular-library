<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useCacheConfig, type CacheStrategy } from "pwa-modular-library";

const DEFAULT_CACHE = "pwa-cache-v1";
const STRATEGIES: CacheStrategy[] = [
  "cache-first",
  "network-first",
  "stale-while-revalidate",
  "network-only",
  "cache-only",
];

const { rules, addRule, removeRule, clearAll, count } = useCacheConfig();

const pattern = ref("/api/*");
const strategy = ref<CacheStrategy>("network-first");
const entryCount = ref(0);
const supported = ref(false);

onMounted(async () => {
  supported.value = typeof caches !== "undefined";
  await refresh();
});

async function refresh(): Promise<void> {
  if (supported.value) entryCount.value = await count();
}

function add(): void {
  if (!pattern.value.trim()) return;
  addRule({ pattern: pattern.value, strategy: strategy.value });
}

async function addSampleEntry(): Promise<void> {
  if (!supported.value) return;
  const cache = await caches.open(DEFAULT_CACHE);
  await cache.put(`/demo/item-${Date.now()}`, new Response("demo payload"));
  await refresh();
}

async function reset(): Promise<void> {
  await clearAll();
  await refresh();
}
</script>

<template>
  <div class="demo-card">
    <h4>Aturan caching</h4>
    <div class="demo-row">
      <input class="demo-input" style="flex: 1 1 12rem" v-model="pattern" placeholder="Pattern URL (mis. /api/*)" />
      <select class="demo-input" style="flex: 0 0 auto; width: auto" v-model="strategy">
        <option v-for="s in STRATEGIES" :key="s" :value="s">{{ s }}</option>
      </select>
      <button class="demo-btn" @click="add">+ Tambah Rule</button>
    </div>

    <ul v-if="rules.length" class="demo-list">
      <li v-for="r in rules" :key="String(r.pattern)">
        <span>{{ r.pattern }} → {{ r.strategy }}</span>
        <a href="#" @click.prevent="removeRule(r.pattern)">hapus</a>
      </li>
    </ul>
    <p v-else class="demo-empty">Belum ada rule. Tambahkan satu di atas.</p>

    <h4>Cache API — count()</h4>
    <p>
      Entri di cache <code>{{ DEFAULT_CACHE }}</code>: <span class="demo-stat">{{ entryCount }}</span>
    </p>
    <div class="demo-row">
      <button class="demo-btn secondary" :disabled="!supported" @click="addSampleEntry">+ Entri contoh</button>
      <button class="demo-btn secondary" :disabled="!supported" @click="reset">Bersihkan semua</button>
    </div>
    <p v-if="!supported" class="demo-note">Cache API tidak tersedia di lingkungan ini.</p>
  </div>
</template>
