/** Public types untuk useInstallPrompt composable. */

import type { Ref } from "vue";

export interface UseInstallPromptReturn {
  /** Apakah browser mendukung A2HS prompt */
  isSupported: Readonly<Ref<boolean>>;
  /** Apakah aplikasi sudah ter-install */
  isInstalled: Readonly<Ref<boolean>>;
  /** Apakah prompt siap ditampilkan */
  canPrompt: Readonly<Ref<boolean>>;
  /** Tampilkan A2HS prompt */
  prompt: () => Promise<"accepted" | "dismissed" | "unavailable">;
}
