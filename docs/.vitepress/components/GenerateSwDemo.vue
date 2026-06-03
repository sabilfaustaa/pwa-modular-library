<script setup lang="ts">
import { ref } from "vue";
import { generateSW } from "pwa-modular-library";

const rulesText = ref(
  JSON.stringify(
    [
      { pattern: "/api/*", strategy: "network-first", cacheName: "api-cache" },
      { pattern: "/assets/*", strategy: "cache-first", cacheName: "asset-cache" },
    ],
    null,
    2,
  ),
);
const postMessage = ref(false);
const output = ref("");
const error = ref<string | null>(null);

function generate(): void {
  error.value = null;
  try {
    const rules = postMessage.value ? [] : JSON.parse(rulesText.value);
    output.value = generateSW(rules, { kirimRulesViaPostMessage: postMessage.value });
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
    <h4>Cache rules (JSON)</h4>
    <textarea class="demo-textarea" v-model="rulesText" :disabled="postMessage" spellcheck="false"></textarea>

    <label class="demo-row" style="gap: 0.4rem; font-size: 0.85rem">
      <input type="checkbox" v-model="postMessage" />
      Mode dynamic postMessage (rules dikirim runtime dari useCacheConfig)
    </label>

    <div class="demo-row">
      <button class="demo-btn" @click="generate">Generate sw.js</button>
      <button class="demo-btn secondary" :disabled="!output" @click="download">⬇ Unduh sw.js</button>
    </div>

    <p v-if="error" class="demo-result" style="color: var(--vp-c-red-1)">Error: {{ error }}</p>
    <pre v-if="output" class="demo-pre">{{ output }}</pre>
  </div>
</template>
