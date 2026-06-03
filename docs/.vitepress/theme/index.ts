import DefaultTheme from "vitepress/theme";
import type { Theme } from "vitepress";
import "./demo.css";

import InstallPromptDemo from "../components/InstallPromptDemo.vue";
import PwaStatusDemo from "../components/PwaStatusDemo.vue";
import NotificationsDemo from "../components/NotificationsDemo.vue";
import CacheConfigDemo from "../components/CacheConfigDemo.vue";
import BackgroundSyncDemo from "../components/BackgroundSyncDemo.vue";
import GenerateSwDemo from "../components/GenerateSwDemo.vue";
import ValidateManifestDemo from "../components/ValidateManifestDemo.vue";

// Komponen demo didaftarkan global agar bisa dipakai langsung di markdown.
export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component("InstallPromptDemo", InstallPromptDemo);
    app.component("PwaStatusDemo", PwaStatusDemo);
    app.component("NotificationsDemo", NotificationsDemo);
    app.component("CacheConfigDemo", CacheConfigDemo);
    app.component("BackgroundSyncDemo", BackgroundSyncDemo);
    app.component("GenerateSwDemo", GenerateSwDemo);
    app.component("ValidateManifestDemo", ValidateManifestDemo);
  },
} satisfies Theme;
