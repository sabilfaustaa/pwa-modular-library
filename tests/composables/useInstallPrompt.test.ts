/**
 * Test: useInstallPrompt composable
 *
 * Module: src/composables/useInstallPrompt.ts
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { nextTick } from "vue";
import { useInstallPrompt } from "../../src/composables/useInstallPrompt";

/** Bikin mock `BeforeInstallPromptEvent`-like object. */
function createDeferredPrompt(outcome: "accepted" | "dismissed" = "accepted") {
  let prompted = false;
  return {
    prompt: vi.fn().mockImplementation(async () => {
      prompted = true;
    }),
    userChoice: Promise.resolve({ outcome, platform: "web" }),
    _prompted: () => prompted,
  };
}

describe("useInstallPrompt", () => {
  beforeEach(() => {
    // Reset display-mode ke browser (default happy-dom)
    vi.stubGlobal(
      "matchMedia",
      vi.fn((query: string) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: undefined,
        removeListener: undefined,
      })),
    );
  });

  describe("isSupported", () => {
    it("should be false before beforeinstallprompt fires", () => {
      const { isSupported } = useInstallPrompt();
      expect(isSupported.value).toBe(false);
    });

    it("should become true after beforeinstallprompt event", async () => {
      const { isSupported } = useInstallPrompt();

      const deferredPrompt = createDeferredPrompt();
      const event = new Event("beforeinstallprompt");
      Object.defineProperty(event, "preventDefault", { value: vi.fn() });
      // Attach deferred prompt-like behavior
      Object.assign(event, deferredPrompt);

      window.dispatchEvent(event);
      await nextTick();

      expect(isSupported.value).toBe(true);
    });
  });

  describe("isInstalled", () => {
    it("should detect standalone display-mode at startup", () => {
      vi.stubGlobal(
        "matchMedia",
        vi.fn((query: string) => ({
          matches: query === "(display-mode: standalone)",
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })),
      );

      const { isInstalled } = useInstallPrompt();
      expect(isInstalled.value).toBe(true);
    });

    it("should be false when not in standalone mode", () => {
      const { isInstalled } = useInstallPrompt();
      expect(isInstalled.value).toBe(false);
    });

    it("should update isInstalled on appinstalled event", async () => {
      const { isInstalled } = useInstallPrompt();
      expect(isInstalled.value).toBe(false);

      window.dispatchEvent(new Event("appinstalled"));
      await nextTick();

      expect(isInstalled.value).toBe(true);
    });
  });

  describe("canPrompt", () => {
    it("should be false initially", () => {
      const { canPrompt } = useInstallPrompt();
      expect(canPrompt.value).toBe(false);
    });

    it("should be true after beforeinstallprompt captured", async () => {
      const { canPrompt } = useInstallPrompt();

      const deferredPrompt = createDeferredPrompt();
      const event = new Event("beforeinstallprompt");
      Object.defineProperty(event, "preventDefault", { value: vi.fn() });
      Object.assign(event, deferredPrompt);

      window.dispatchEvent(event);
      await nextTick();

      expect(canPrompt.value).toBe(true);
    });

    it("should be false again after appinstalled", async () => {
      const { canPrompt } = useInstallPrompt();

      // Capture prompt dulu
      const deferredPrompt = createDeferredPrompt();
      const event = new Event("beforeinstallprompt");
      Object.defineProperty(event, "preventDefault", { value: vi.fn() });
      Object.assign(event, deferredPrompt);
      window.dispatchEvent(event);
      await nextTick();
      expect(canPrompt.value).toBe(true);

      // App installed
      window.dispatchEvent(new Event("appinstalled"));
      await nextTick();
      expect(canPrompt.value).toBe(false);
    });

    it("should not be true if already installed at capture time", async () => {
      // Simulate installed state
      vi.stubGlobal(
        "matchMedia",
        vi.fn((query: string) => ({
          matches: query === "(display-mode: standalone)",
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })),
      );

      const { canPrompt } = useInstallPrompt();

      const deferredPrompt = createDeferredPrompt();
      const event = new Event("beforeinstallprompt");
      Object.defineProperty(event, "preventDefault", { value: vi.fn() });
      Object.assign(event, deferredPrompt);
      window.dispatchEvent(event);
      await nextTick();

      // Already installed — prompt should not be available
      expect(canPrompt.value).toBe(false);
    });
  });

  describe("prompt()", () => {
    it("should return 'unavailable' when no deferred prompt", async () => {
      const { prompt } = useInstallPrompt();
      const result = await prompt();
      expect(result).toBe("unavailable");
    });

    it("should return 'accepted' on user choice: accepted", async () => {
      const { prompt } = useInstallPrompt();

      const deferredPrompt = createDeferredPrompt("accepted");
      const event = new Event("beforeinstallprompt");
      Object.defineProperty(event, "preventDefault", { value: vi.fn() });
      Object.assign(event, deferredPrompt);
      window.dispatchEvent(event);
      await nextTick();

      const result = await prompt();
      expect(result).toBe("accepted");
      expect(deferredPrompt.prompt).toHaveBeenCalledTimes(1);
    });

    it("should return 'dismissed' on user choice: dismissed", async () => {
      const { prompt } = useInstallPrompt();

      const deferredPrompt = createDeferredPrompt("dismissed");
      const event = new Event("beforeinstallprompt");
      Object.defineProperty(event, "preventDefault", { value: vi.fn() });
      Object.assign(event, deferredPrompt);
      window.dispatchEvent(event);
      await nextTick();

      const result = await prompt();
      expect(result).toBe("dismissed");
    });

    it("should set canPrompt=false after prompt (one-time use)", async () => {
      const { canPrompt, prompt } = useInstallPrompt();

      const deferredPrompt = createDeferredPrompt("accepted");
      const event = new Event("beforeinstallprompt");
      Object.defineProperty(event, "preventDefault", { value: vi.fn() });
      Object.assign(event, deferredPrompt);
      window.dispatchEvent(event);
      await nextTick();

      expect(canPrompt.value).toBe(true);
      await prompt();
      expect(canPrompt.value).toBe(false);
    });

    it("should return 'unavailable' on second prompt call", async () => {
      const { prompt } = useInstallPrompt();

      const deferredPrompt = createDeferredPrompt("accepted");
      const event = new Event("beforeinstallprompt");
      Object.defineProperty(event, "preventDefault", { value: vi.fn() });
      Object.assign(event, deferredPrompt);
      window.dispatchEvent(event);
      await nextTick();

      const first = await prompt();
      expect(first).toBe("accepted");

      const second = await prompt();
      expect(second).toBe("unavailable");
    });

    it("should return 'unavailable' if prompt() throws", async () => {
      const { prompt } = useInstallPrompt();

      const deferredPrompt = {
        prompt: vi.fn().mockRejectedValue(new Error("Prompt can only be called from user gesture")),
        userChoice: Promise.resolve({ outcome: "accepted" as const, platform: "web" }),
      };
      const event = new Event("beforeinstallprompt");
      Object.defineProperty(event, "preventDefault", { value: vi.fn() });
      Object.assign(event, deferredPrompt);
      window.dispatchEvent(event);
      await nextTick();

      const result = await prompt();
      expect(result).toBe("unavailable");
    });
  });
});
