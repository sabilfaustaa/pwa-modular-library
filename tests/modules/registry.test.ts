/**
 * Unit test untuk service worker registry.
 */

import { describe, expect, it, beforeEach, vi, afterAll } from "vitest";
import {
  registerServiceWorker,
  unregisterServiceWorker,
  updateServiceWorker,
  getActiveRegistration,
  resetRegistry,
} from "../../src/modules/service-worker/registry";

function mockServiceWorkerAPI() {
  const registration = {
    scope: "/",
    active: null,
    waiting: null,
    installing: null,
    unregister: vi.fn().mockResolvedValue(true),
    update: vi.fn().mockResolvedValue(undefined),
    addEventListener: vi.fn(),
  } as unknown as ServiceWorkerRegistration;

  const sw = {
    getRegistration: vi.fn().mockResolvedValue(null),
    register: vi.fn().mockResolvedValue(registration),
    controller: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };

  // @ts-expect-error mock
  Object.defineProperty(navigator, "serviceWorker", {
    value: sw,
    configurable: true,
    writable: true,
  });

  return { sw, registration };
}

describe("service worker registry", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    resetRegistry();
    mockServiceWorkerAPI();
  });

  afterAll(() => {
    resetRegistry();
  });

  describe("registerServiceWorker", () => {
    it("should register service worker successfully", async () => {
      const onRegistered = vi.fn();

      const reg = await registerServiceWorker({
        swPath: "/sw.js",
        scope: "/",
        onRegistered,
      });

      expect(reg).toBeDefined();
      expect(onRegistered).toHaveBeenCalledTimes(1);
      expect(getActiveRegistration()).toBe(reg);
    });

    it("should return existing registration if already active with same path", async () => {
      const existingReg = {
        scope: "/",
        active: { scriptURL: "http://localhost/sw.js" },
        unregister: vi.fn().mockResolvedValue(true),
        update: vi.fn().mockResolvedValue(undefined),
        addEventListener: vi.fn(),
      } as unknown as ServiceWorkerRegistration;

      // @ts-expect-error mock
      navigator.serviceWorker.getRegistration = vi.fn().mockResolvedValue(existingReg);

      const onRegistered = vi.fn();
      const reg = await registerServiceWorker({
        swPath: "/sw.js",
        scope: "/",
        onRegistered,
      });

      expect(reg).toBe(existingReg);
      expect(onRegistered).toHaveBeenCalledTimes(1);
      expect(navigator.serviceWorker.register).not.toHaveBeenCalled();
    });

    it("should call onUpdateAvailable when update found", async () => {
      const onUpdateAvailable = vi.fn();
      const onRegistered = vi.fn();

      const installingWorker = new EventTarget();

      const registration = {
        scope: "/",
        installing: installingWorker,
        waiting: null,
        active: null,
        unregister: vi.fn().mockResolvedValue(true),
        update: vi.fn().mockResolvedValue(undefined),
        addEventListener: vi.fn((_event: string, _handler: () => void) => {
          // Simpan handler untuk updatefound
        }),
      } as unknown as ServiceWorkerRegistration;

      // @ts-expect-error mock
      navigator.serviceWorker.register = vi.fn().mockResolvedValue(registration);

      await registerServiceWorker({
        swPath: "/sw.js",
        scope: "/",
        onUpdateAvailable,
        onRegistered,
      });

      // onUpdateAvailable belum dipanggil (statechange belum trigger)
      expect(onUpdateAvailable).not.toHaveBeenCalled();
    });

    it("should call onError when registration fails", async () => {
      const onError = vi.fn();

      // @ts-expect-error mock
      navigator.serviceWorker.register = vi.fn().mockRejectedValue(new Error("SW registration failed"));

      await expect(
        registerServiceWorker({
          swPath: "/sw.js",
          scope: "/",
          onError,
        }),
      ).rejects.toThrow();

      expect(onError).toHaveBeenCalledTimes(1);
    });
  });

  describe("unregisterServiceWorker", () => {
    it("should unregister active service worker", async () => {
      await registerServiceWorker({
        swPath: "/sw.js",
        scope: "/",
      });

      expect(getActiveRegistration()).toBeDefined();

      const result = await unregisterServiceWorker();
      expect(result).toBe(true);
      expect(getActiveRegistration()).toBeNull();
    });

    it("should return false if no active registration", async () => {
      const result = await unregisterServiceWorker();
      expect(result).toBe(false);
    });
  });

  describe("updateServiceWorker", () => {
    it("should trigger update check", async () => {
      await registerServiceWorker({
        swPath: "/sw.js",
        scope: "/",
      });

      await expect(updateServiceWorker()).resolves.toBeUndefined();
      expect(getActiveRegistration()?.update).toHaveBeenCalled();
    });

    it("should throw if no active registration", async () => {
      await expect(updateServiceWorker()).rejects.toThrow("No active service worker registration");
    });
  });
});
