<script setup lang="ts">
import { ref, computed } from "vue";
import { generateSW, type GenerateSWOptions } from "pwa-modular-library";

const rulesText = ref(
  JSON.stringify(
    [
      { pattern: "*/api/*", strategy: "network-first", cacheName: "api-cache" },
      { pattern: "*/assets/*", strategy: "cache-first", cacheName: "asset-cache" },
    ],
    null,
    2,
  ),
);

// Mode: static embed (rules ditanam saat build) vs dynamic postMessage (rules dari useCacheConfig).
const mode = ref<"static" | "dynamic">("static");

// Opsi generateSW (v1.1.0).
const precacheText = ref("/, /index.html, /assets/app.css");
const usePrecache = ref(false);
const navigationFallback = ref("/index.html");
const useNavFallback = ref(false);
const cacheVersion = ref("v1");
const skipNonGet = ref(true);
const skipWaiting = ref(false);

const output = ref("");
const error = ref<string | null>(null);

const outputStats = computed(() => {
  if (!output.value) return null;
  const lines = output.value.split("\n").length;
  const bytes = new TextEncoder().encode(output.value).length;
  return `${lines} baris · ${(bytes / 1024).toFixed(1)} KB`;
});

function buildOptions(): GenerateSWOptions {
  return {
    kirimRulesViaPostMessage: mode.value === "dynamic",
    ...(usePrecache.value
      ? {
          precache: precacheText.value
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        }
      : {}),
    ...(useNavFallback.value && navigationFallback.value.trim()
      ? { navigationFallback: navigationFallback.value.trim() }
      : {}),
    cacheVersion: cacheVersion.value.trim() || "v1",
    skipNonGet: skipNonGet.value,
    skipWaiting: skipWaiting.value,
  };
}

function generate(): void {
  error.value = null;
  try {
    const rules = mode.value === "dynamic" ? [] : JSON.parse(rulesText.value);
    output.value = generateSW(rules, buildOptions());
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
    output.value = "";
  }
}

function download(): void {
  if (!output.value) return;
  const blob = new Blob([output.value], { type: "text/javascript" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "sw.js";
  a.click();
  URL.revokeObjectURL(url);
}
</script>

<template>
  <div class="demo-card">
    <h4>1 · Pilih mode</h4>
    <div class="demo-row">
      <label class="demo-radio">
        <input type="radio" value="static" v-model="mode" />
        <span><strong>Static embed</strong> — rules ditanam ke <code>sw.js</code> saat build</span>
      </label>
      <label class="demo-radio">
        <input type="radio" value="dynamic" v-model="mode" />
        <span><strong>Dynamic postMessage</strong> — rules dikirim runtime dari <code>useCacheConfig()</code></span>
      </label>
    </div>

    <template v-if="mode === 'static'">
      <h4>2 · Cache rules (JSON)</h4>
      <textarea class="demo-textarea" v-model="rulesText" spellcheck="false"></textarea>
      <p class="demo-note">
        Pakai pola string ter-anchor (<code>*/api/*</code>) — pada mode static embed, <code>RegExp</code>
        ter-serialisasi menjadi <code>{}</code> oleh <code>JSON.stringify</code> dan tidak pernah cocok.
      </p>
    </template>
    <p v-else class="demo-note">
      Mode dinamis: <code>sw.js</code> dibangkitkan tanpa rules — SW meminta rules ke thread utama saat
      cold start, lalu menerima pembaruan setiap <code>addRule</code>/<code>removeRule</code>.
    </p>

    <h4>{{ mode === "static" ? "3" : "2" }} · Opsi (v1.1.0)</h4>
    <label class="demo-row demo-opt">
      <input type="checkbox" v-model="usePrecache" />
      <span><code>precache</code> — app-shell di-cache saat <code>install</code>:</span>
      <input
        class="demo-input"
        style="flex: 1 1 12rem"
        v-model="precacheText"
        :disabled="!usePrecache"
        placeholder="URL dipisah koma"
      />
    </label>
    <label class="demo-row demo-opt">
      <input type="checkbox" v-model="useNavFallback" />
      <span><code>navigationFallback</code> — halaman fallback navigasi saat offline:</span>
      <input
        class="demo-input"
        style="flex: 1 1 8rem"
        v-model="navigationFallback"
        :disabled="!useNavFallback"
        placeholder="/index.html"
      />
    </label>
    <label class="demo-row demo-opt">
      <span><code>cacheVersion</code> — bump untuk membersihkan cache lama saat <code>activate</code>:</span>
      <input class="demo-input" style="flex: 0 1 6rem" v-model="cacheVersion" placeholder="v1" />
    </label>
    <label class="demo-row demo-opt">
      <input type="checkbox" v-model="skipNonGet" />
      <span><code>skipNonGet</code> — jangan intercept POST/PUT/PATCH/DELETE <em>(default: aktif)</em></span>
    </label>
    <label class="demo-row demo-opt">
      <input type="checkbox" v-model="skipWaiting" />
      <span>
        <code>skipWaiting</code> — SW baru langsung aktif; nonaktif = menunggu konfirmasi user
        <em>(default: nonaktif)</em>
      </span>
    </label>

    <div class="demo-row">
      <button class="demo-btn" @click="generate">Generate sw.js</button>
      <button class="demo-btn secondary" :disabled="!output" @click="download">⬇ Unduh sw.js</button>
      <span v-if="outputStats" class="badge on">{{ outputStats }}</span>
    </div>

    <p v-if="error" class="demo-result" style="color: var(--vp-c-red-1)">Error: {{ error }}</p>
    <details v-if="output" class="demo-details" open>
      <summary>Hasil <code>sw.js</code></summary>
      <pre class="demo-pre">{{ output }}</pre>
    </details>
  </div>
</template>
