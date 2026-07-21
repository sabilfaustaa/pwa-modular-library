<script setup lang="ts">
import { ref } from "vue";
import { validateManifest, type ManifestWarning } from "pwa-modular-library";

const PRESETS = {
  lengkap: {
    label: "Manifest lengkap",
    value: {
      name: "My PWA App",
      short_name: "App",
      start_url: "/",
      display: "standalone",
      icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }],
    },
  },
  minimal: {
    label: "Manifest minim (banyak warning)",
    value: { name: "My PWA App" },
  },
  kosong: {
    label: "Objek kosong",
    value: {},
  },
} as const;

const manifestText = ref(JSON.stringify(PRESETS.lengkap.value, null, 2));
const warnings = ref<ManifestWarning[]>([]);
const parseError = ref<string | null>(null);
const checked = ref(false);

function loadPreset(key: keyof typeof PRESETS): void {
  manifestText.value = JSON.stringify(PRESETS[key].value, null, 2);
  validate();
}

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
    <div class="demo-row">
      <span class="demo-note">Contoh cepat:</span>
      <button v-for="(p, key) in PRESETS" :key="key" class="demo-btn secondary" @click="loadPreset(key)">
        {{ p.label }}
      </button>
    </div>
    <textarea class="demo-textarea" v-model="manifestText" spellcheck="false"></textarea>

    <div class="demo-row">
      <button class="demo-btn" @click="validate">Validasi</button>
      <span v-if="checked && !parseError" class="badge" :class="warnings.length === 0 ? 'on' : 'warn'">
        {{ warnings.length }} warning
      </span>
    </div>

    <p v-if="parseError" class="demo-result" style="color: var(--vp-c-red-1)">JSON tidak valid: {{ parseError }}</p>

    <template v-if="checked && !parseError">
      <p v-if="warnings.length === 0" class="demo-result" style="color: var(--vp-c-green-1)">
        ✓ Manifest lengkap — tidak ada warning. Aplikasi memenuhi syarat manifest untuk installability.
      </p>
      <ul v-else class="demo-list">
        <li v-for="(w, i) in warnings" :key="i">
          <span><strong>{{ w.field }}</strong>: {{ w.message }}</span>
        </li>
      </ul>
    </template>
    <p class="demo-note">
      <code>validateManifest()</code> mengembalikan daftar warning (bukan melempar error) — cocok
      dijalankan saat build atau development untuk mendiagnosis kenapa prompt instalasi tidak muncul.
    </p>
  </div>
</template>
