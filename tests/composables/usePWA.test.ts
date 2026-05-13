/**
 * Unit + integration test untuk usePWA composable.
 */

import { describe, expect, it, beforeEach, afterAll, vi } from "vitest";
import { usePWA } from "../../src/composables/usePWA";
import { resetRegistry } from "../../src/modules/service-worker/registry";

/** Drain semua microtask yang pending. */
function flushPromises(): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, 0));
}

describe("usePWA", () => {
  describe("supported browser", () => {
    let mockRegistration: ServiceWorkerRegistration;

    beforeEach(() => {
      vi.restoreAllMocks();
      resetRegistry();

      mockRegistration = {
        scope: "/",
        active: { scriptURL: "http://localhost:3000/sw.js" },
        waiting: null,
        installing: null,
        unregister: vi.fn().mockResolvedValue(true),
        update: vi.fn().mockResolvedValue(undefined),
        addEventListener: vi.fn(),
      } as unknown as ServiceWorkerRegistration;

      // @ts-expect-error navigator.serviceWorker mock
      Object.defineProperty(navigator, "serviceWorker", {
        value: {
          getRegistration: vi.fn().mockResolvedValue(null),
          register: vi.fn().mockResolvedValue(mockRegistration),
          controller: null,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        },
        configurable: true,
        writable: true,
      });
    });

    afterAll(() => {
      resetRegistry();
    });

    it("should return initial state before SW registers", () => {
      const pwa = usePWA();

      expect(pwa.isRegistered.value).toBe(false);
      expect(pwa.hasUpdate.value).toBe(false);
      expect(pwa.isOnline.value).toBe(true);
    });

    it("should set isRegistered after SW registration succeeds", async () => {
      const pwa = usePWA();

      await flushPromises();
      await flushPromises();

      expect(pwa.isRegistered.value).toBe(true);
    });

    it("should call onRegistered callback when SW registers", async () => {
      const onRegistered = vi.fn();

      usePWA({ onRegistered });

      await flushPromises();
      await flushPromises();

      expect(onRegistered).toHaveBeenCalledTimes(1);
      expect(onRegistered).toHaveBeenCalledWith(mockRegistration);
    });

    it("should call onError callback when registration fails", async () => {
      // @ts-expect-error mock
      Object.defineProperty(navigator, "serviceWorker", {
        value: {
          getRegistration: vi.fn().mockResolvedValue(null),
          register: vi.fn().mockRejectedValue(new Error("Registration failed")),
          controller: null,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        },
        configurable: true,
        writable: true,
      });

      const onError = vi.fn();

      usePWA({ onError });

      await flushPromises();
      await flushPromises();

      expect(onError).toHaveBeenCalledTimes(1);
    });

    it("should update isOnline when offline/online events fire", () => {
      const pwa = usePWA();

      window.dispatchEvent(new Event("offline"));
      expect(pwa.isOnline.value).toBe(false);

      window.dispatchEvent(new Event("online"));
      expect(pwa.isOnline.value).toBe(true);
    });

    it("should expose update and unregister methods", () => {
      const pwa = usePWA();

      expect(typeof pwa.update).toBe("function");
      expect(typeof pwa.unregister).toBe("function");
    });

    it("should unregister and reset state", async () => {
      const pwa = usePWA();

      await flushPromises();
      await flushPromises();
      expect(pwa.isRegistered.value).toBe(true);

      const result = await pwa.unregister();
      expect(result).toBe(true);
      expect(pwa.isRegistered.value).toBe(false);
      expect(pwa.hasUpdate.value).toBe(false);
    });

    it("should accept custom swPath and scope", async () => {
      usePWA({ swPath: "/custom-sw.js", scope: "/app/" });

      await flushPromises();
      await flushPromises();

      // @ts-expect-error - mock serviceWorker.register is partial, missing overload signatures
      expect(navigator.serviceWorker.register).toHaveBeenCalledWith("/custom-sw.js", { scope: "/app/" });
    });

    it("should handle autoUpdate: false option without crash", async () => {
      usePWA({ autoUpdate: false });

      await flushPromises();
      await flushPromises();

      // Should not throw
    });
  });

  describe("unsupported browser", () => {
    beforeEach(() => {
      vi.restoreAllMocks();

      // @ts-expect-error serviceWorker not present
      Object.defineProperty(navigator, "serviceWorker", {
        value: undefined,
        configurable: true,
        writable: true,
      });
    });

    it("should not throw and keep isRegistered=false", () => {
      expect(() => usePWA()).not.toThrow();

      const pwa = usePWA();
      expect(pwa.isRegistered.value).toBe(false);
      expect(pwa.isOnline.value).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("should unregister return false when no active SW", async () => {
      // @ts-expect-error mock
      Object.defineProperty(navigator, "serviceWorker", {
        value: {
          getRegistration: vi.fn().mockResolvedValue(null),
          register: vi.fn().mockResolvedValue({
            scope: "/",
            active: { scriptURL: "http://localhost:3000/sw.js" },
            unregister: vi.fn().mockResolvedValue(true),
            update: vi.fn().mockResolvedValue(undefined),
            addEventListener: vi.fn(),
          }),
          controller: null,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        },
        configurable: true,
        writable: true,
      });

      const pwa = usePWA();
      // Jangan tunggu register (tetap false karena belum resolve)
      const result = await pwa.unregister();
      expect(result).toBe(false);
    });
  });
});
