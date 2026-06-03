/**
 * useInstallPrompt — Tangkap Add-to-Home-Screen (A2HS) prompt browser.
 *
 * Composable ini menangkap event `beforeinstallprompt` dari browser
 * (Chrome/Edge/Samsung Internet) dan menyediakan API untuk menampilkan
 * prompt install kustom.
 *
 * @module composables/useInstallPrompt
 */

import { ref, readonly, onUnmounted, type Ref } from "vue";
import type { UseInstallPromptReturn } from "../types/install.types";

/**
 * Subset internal dari `BeforeInstallPromptEvent` (belum ada di lib DOM
 * standar TypeScript). Hanya field yang kita pakai.
 */
interface DeferredPrompt {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

/** Check apakah window tersedia (SSR-safe). */
function hasWindow(): boolean {
  return typeof window !== "undefined";
}

/**
 * Deteksi apakah aplikasi sedang berjalan dalam mode standalone/installed.
 *
 * Mengandalkan CSS `display-mode` media query — cara paling reliable
 * lintas browser tanpa bergantung ke event `appinstalled` yang
 * sifatnya session-scoped.
 */
function checkInstalled(): boolean {
  if (!hasWindow()) return false;
  return window.matchMedia("(display-mode: standalone)").matches;
}

/**
 * Composable untuk Add to Home Screen prompt.
 *
 * Menangkap event `beforeinstallprompt` (Chrome/Edge/Samsung Internet),
 * melacak status install via `appinstalled` event dan CSS media query,
 * serta menyediakan method `prompt()` untuk trigger dialog install.
 *
 * @returns Object dengan state reactive (`isSupported`, `isInstalled`,
 * `canPrompt`) dan method `prompt()`.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useInstallPrompt } from 'pwa-modular-library'
 *
 * const { isSupported, isInstalled, canPrompt, prompt } = useInstallPrompt()
 *
 * async function handleInstall() {
 *   const result = await prompt()
 *   if (result === 'accepted') console.log('User installed!')
 * }
 * </script>
 *
 * <template>
 *   <button v-if="canPrompt" @click="handleInstall">
 *     Install App
 *   </button>
 * </template>
 * ```
 */
export function useInstallPrompt(): UseInstallPromptReturn {
  /** Apakah browser mendukung A2HS prompt (pernah fire `beforeinstallprompt`). */
  const isSupported = ref(false);

  /** Apakah aplikasi saat ini ter-install (standalone mode atau `appinstalled` fired). */
  const isInstalled = ref(checkInstalled());

  /** Apakah deferred prompt tersedia dan siap dipanggil. */
  const canPrompt = ref(false);

  /** Simpan deferred prompt dari event `beforeinstallprompt`. */
  let deferredPrompt: DeferredPrompt | null = null;

  // --- Event handlers ---

  function onBeforeInstallPrompt(event: Event): void {
    event.preventDefault();
    deferredPrompt = event as unknown as DeferredPrompt;
    isSupported.value = true;
    // Prompt hanya available kalau app belum ter-install
    if (!isInstalled.value) {
      canPrompt.value = true;
    }
  }

  function onAppInstalled(): void {
    isInstalled.value = true;
    canPrompt.value = false;
    deferredPrompt = null;
  }

  // Waspadai perubahan display-mode (edge case: user uninstall via OS)
  function onDisplayModeChange(event: MediaQueryListEvent): void {
    isInstalled.value = event.matches;
    if (event.matches) {
      canPrompt.value = false;
    }
  }

  // --- Subscribe events (SSR-safe) ---

  let displayModeQuery: MediaQueryList | null = null;

  if (hasWindow()) {
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    displayModeQuery = window.matchMedia("(display-mode: standalone)");
    // Modern browsers support addEventListener on MediaQueryList
    if (typeof displayModeQuery.addEventListener === "function") {
      displayModeQuery.addEventListener("change", onDisplayModeChange);
    }
    // Fallback: gunakan listener lama (Safari < 14)
    else if (typeof (displayModeQuery as MediaQueryList & { addListener: unknown }).addListener === "function") {
      (
        displayModeQuery as MediaQueryList & { addListener: (cb: (e: MediaQueryListEvent) => void) => void }
      ).addListener(onDisplayModeChange);
    }
  }

  // --- Cleanup ---

  onUnmounted(() => {
    if (hasWindow()) {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);

      if (displayModeQuery) {
        if (typeof displayModeQuery.removeEventListener === "function") {
          displayModeQuery.removeEventListener("change", onDisplayModeChange);
        } else if (
          typeof (displayModeQuery as MediaQueryList & { removeListener: unknown }).removeListener === "function"
        ) {
          (
            displayModeQuery as MediaQueryList & { removeListener: (cb: (e: MediaQueryListEvent) => void) => void }
          ).removeListener(onDisplayModeChange);
        }
      }
    }
  });

  // --- prompt() ---

  /**
   * Tampilkan dialog Add to Home Screen bawaan browser.
   *
   * @returns `'accepted'` jika user klik "Install",
   *          `'dismissed'` jika user klik "Cancel"/close,
   *          `'unavailable'` jika prompt tidak tersedia.
   */
  async function prompt(): Promise<"accepted" | "dismissed" | "unavailable"> {
    if (!deferredPrompt || !canPrompt.value) {
      return "unavailable";
    }

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;

      // Prompt hanya bisa dipakai sekali — setelah itu hangus
      canPrompt.value = false;
      deferredPrompt = null;

      return choice.outcome === "accepted" ? "accepted" : "dismissed";
    } catch {
      // Browser mungkin throw jika prompt dipanggil di luar user gesture
      // atau jika deferred prompt sudah expired
      canPrompt.value = false;
      deferredPrompt = null;
      return "unavailable";
    }
  }

  return {
    isSupported: readonly(isSupported) as Readonly<Ref<boolean>>,
    isInstalled: readonly(isInstalled) as Readonly<Ref<boolean>>,
    canPrompt: readonly(canPrompt) as Readonly<Ref<boolean>>,
    prompt,
  };
}

export type { UseInstallPromptReturn };
