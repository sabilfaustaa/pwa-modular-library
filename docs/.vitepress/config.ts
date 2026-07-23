import { defineConfig } from "vitepress";
import { fileURLToPath, URL } from "node:url";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "PWA Modular Library",
  description:
    "Library modular Vue 3 + TypeScript untuk akselerasi implementasi Progressive Web Apps pada sistem dengan keterbatasan konektivitas.",
  lang: "id-ID",
  // GitHub Pages project sites are served below the repository name.
  base: "/pwa-modular-library/",
  lastUpdated: true,
  cleanUrls: true,

  themeConfig: {
    nav: [
      { text: "Panduan", link: "/getting-started" },
      { text: "Composables", link: "/service-worker" },
      { text: "Utilitas", link: "/utilities/generate-sw" },
      { text: "Contoh", link: "/examples/" },
    ],

    sidebar: [
      {
        text: "Panduan",
        items: [
          { text: "Memulai", link: "/getting-started" },
          { text: "Dukungan Browser", link: "/browser-support" },
        ],
      },
      {
        text: "Composables",
        items: [
          { text: "usePWA — Service Worker", link: "/service-worker" },
          { text: "useCacheConfig — Caching", link: "/cache" },
          { text: "useNotifications — Notifikasi", link: "/notification" },
          { text: "useBackgroundSync — Offline Queue", link: "/sync" },
          { text: "useInstallPrompt — A2HS", link: "/install-prompt" },
        ],
      },
      {
        text: "Utilitas",
        items: [
          { text: "generateSW", link: "/utilities/generate-sw" },
          { text: "validateManifest", link: "/utilities/validate-manifest" },
        ],
      },
      {
        text: "Contoh Interaktif",
        items: [
          { text: "Ikhtisar", link: "/examples/" },
          { text: "Status PWA & Update", link: "/examples/pwa-status" },
          { text: "Install Prompt (A2HS)", link: "/examples/install-prompt" },
          { text: "Notification Playground", link: "/examples/notifications" },
          { text: "Konfigurasi Cache & count()", link: "/examples/cache-config" },
          { text: "Form Offline + Antrean Sync", link: "/examples/background-sync" },
          { text: "Generator sw.js", link: "/examples/generate-sw" },
          { text: "Validator Manifest", link: "/examples/validate-manifest" },
        ],
      },
    ],

    search: { provider: "local" },

    socialLinks: [{ icon: "github", link: "https://github.com/" }],

    footer: {
      message: "Dirilis di bawah lisensi MIT.",
      copyright: "Muhamad Sabil Fausta — artefak penelitian skripsi.",
    },
  },

  vite: {
    resolve: {
      alias: {
        // Komponen demo mengimpor library persis seperti konsumen.
        "pwa-modular-library": fileURLToPath(new URL("../../src/index.ts", import.meta.url)),
      },
    },
  },
});
