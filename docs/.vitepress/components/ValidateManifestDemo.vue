<script setup lang="ts">
import { ref } from "vue";
import { validateManifest, type ManifestWarning } from "pwa-modular-library";

const manifestText = ref(
  JSON.stringify(
    {
      name: "My PWA App",
      short_name: "App",
      start_url: "/",
      display: "standalone",
      icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }],
    },
    null,
    2,
  ),
);
const warnings = ref<ManifestWarning[]>([]);
const parseError = ref<string | null>(null);
const checked = ref(false);

function validate(): void {
  parseError.value = null;
  checked.value = false;
  try {
    const manifest = JSON.parse(manifestText.value);
    warnings.value = validateManifest(manifest);
    checked.value = true;
  } catch (e) {
    parseError.value = e instanceof Error ? e.message : String(e);
  }
}
</script>

<template>
  <div class="demo-card">
    <h4>manifest.json</h4>
    <textarea class="demo-textarea" v-model="manifestText" spellcheck="false"></textarea>

    <div class="demo-row">
      <button class="demo-btn" @click="validate">Validasi</button>
    </div>

    <p v-if="parseError" class="demo-result" style="color: var(--vp-c-red-1)">JSON tidak valid: {{ parseError }}</p>

    <template v-if="checked && !parseError">
      <p v-if="warnings.length === 0" class="demo-result" style="color: var(--vp-c-green-1)">
        ✓ Manifest lengkap — tidak ada warning.
      </p>
      <ul v-else class="demo-list">
        <li v-for="(w, i) in warnings" :key="i">
          <span><strong>{{ w.field }}</strong>: {{ w.message }}</span>
        </li>
      </ul>
    </template>
  </div>
</template>
