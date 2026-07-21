<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
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

const pattern = ref("*/api/*");
const strategy = ref<CacheStrategy>("network-first");
const cacheName = ref("");
const testUrl = ref("https://app.example.com/api/users");
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
  addRule({
    pattern: pattern.value,
    strategy: strategy.value,
    ...(cacheName.value.trim() ? { cacheName: cacheName.value.trim() } : {}),
  });
}

// Replika semantik matchGlob library: escape karakter regex kecuali `*`,
// `*` → `.*`, lalu diuji ter-anchor (^…$) terhadap URL penuh.
function matchGlob(url: string, pat: string): boolean {
  const escaped = pat.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${escaped.replace(/\*/g, ".*")}$`).test(url);
}

function ruleMatches(url: string, p: string | RegExp): boolean {
  if (typeof p === "string") return matchGlob(url, p);
  if (p instanceof RegExp) return p.test(url);
  return false;
}

// Rule pertama yang cocok menang (first-match wins) — sama seperti registry library.
const matchedIndex = computed(() => {
  const url = testUrl.value.trim();
  if (!url) return -1;
  return rules.value.findIndex((r) => ruleMatches(url, r.pattern as string | RegExp));
});

const matchedRule = computed(() => (matchedIndex.value >= 0 ? rules.value[matchedIndex.value] : null));

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
    <h4>1 · Susun aturan caching</h4>
    <div class="demo-row">
      <input class="demo-input" style="flex: 1 1 10rem" v-model="pattern" placeholder="Pattern URL (mis. */api/*)" />
      <select class="demo-input" style="flex: 0 0 auto; width: auto" v-model="strategy">
        <option v-for="s in STRATEGIES" :key="s" :value="s">{{ s }}</option>
      </select>
      <input class="demo-input" style="flex: 1 1 8rem" v-model="cacheName" placeholder="cacheName (opsional)" />
      <button class="demo-btn" @click="add">+ Tambah Rule</button>
    </div>
    <p class="demo-note">
      Pola string diuji ter-anchor terhadap URL <strong>penuh</strong> — karena itu contohnya diawali
      <code>*</code> (<code>*/api/*</code>), bukan <code>/api/*</code>. Coba sendiri di langkah 2.
    </p>

    <ol v-if="rules.length" class="demo-list">
      <li v-for="(r, i) in rules" :key="String(r.pattern)" :class="{ 'demo-hit': i === matchedIndex }">
        <span>
          <code>{{ r.pattern }}</code> → {{ r.strategy }}
          <em v-if="r.cacheName" class="demo-dim">({{ r.cacheName }})</em>
          <span v-if="i === matchedIndex" class="badge on" style="margin-left: 0.4rem">match</span>
        </span>
        <a href="#" @click.prevent="removeRule(r.pattern)">hapus</a>
      </li>
    </ol>
    <p v-else class="demo-empty">Belum ada rule. Tambahkan satu di atas.</p>

    <h4>2 · Uji URL — rule mana yang menangani?</h4>
    <input class="demo-input" v-model="testUrl" placeholder="https://app.example.com/api/users" spellcheck="false" />
    <p class="demo-result" v-if="rules.length && testUrl.trim()">
      <template v-if="matchedRule">
        ✅ Ditangani rule #{{ matchedIndex + 1 }} — <code>{{ matchedRule.pattern }}</code> →
        <strong>{{ matchedRule.strategy }}</strong>. Aturan pertama yang cocok menang
        (<em>first-match wins</em>), urutan pendaftaran menentukan prioritas.
      </template>
      <template v-else>
        ⚠️ Tidak ada rule yang cocok — request diteruskan ke jaringan tanpa caching (perilaku default).
        Ingat: <code>/api/*</code> tidak pernah cocok karena URL penuh diawali <code>https://…</code>.
      </template>
    </p>
    <p class="demo-note" v-else>Tambahkan rule lalu ketik URL untuk melihat pencocokan secara langsung.</p>

    <h4>3 · Cache API — count()</h4>
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
