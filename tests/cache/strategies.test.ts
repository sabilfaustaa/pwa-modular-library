import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DefaultCacheManager } from "../../src/cache/manager";
import { cacheFirst, networkFirst, staleWhileRevalidate } from "../../src/cache/strategies";
import { CacheNetworkError } from "../../src/core/errors";
import { installMockCacheStorage, uninstallMockCacheStorage } from "./test-utils";

describe("cache strategies", () => {
  beforeEach(() => {
    installMockCacheStorage();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    uninstallMockCacheStorage();
    vi.restoreAllMocks();
  });

  describe("cacheFirst", () => {
    it("should return cached response when cache hit exists", async () => {
      const manager = new DefaultCacheManager({
        cacheName: "strategy-cache",
      });

      await manager.put("/cache-first-hit", new Response("from-cache", { status: 200 }));

      const fetchSpy = vi.spyOn(globalThis, "fetch");

      const result = await cacheFirst({
        request: new Request("http://localhost/cache-first-hit"),
        cacheName: "strategy-cache",
        manager,
      });

      expect(result.source).toBe("cache");
      expect(await result.response.text()).toBe("from-cache");
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("should fetch network and cache response when cache miss happens", async () => {
      const manager = new DefaultCacheManager({
        cacheName: "strategy-cache",
      });

      vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("from-network", { status: 200 }));

      const result = await cacheFirst({
        request: new Request("http://localhost/cache-first-miss"),
        cacheName: "strategy-cache",
        manager,
      });

      const cached = await manager.match("/cache-first-miss");

      expect(result.source).toBe("network");
      expect(await result.response.text()).toBe("from-network");
      expect(cached).toBeDefined();
      expect(await cached?.text()).toBe("from-network");
    });

    it("should throw CacheNetworkError when cache miss and network fails", async () => {
      const manager = new DefaultCacheManager({
        cacheName: "strategy-cache",
      });

      vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network down"));

      await expect(
        cacheFirst({
          request: new Request("http://localhost/cache-first-error"),
          cacheName: "strategy-cache",
          manager,
        }),
      ).rejects.toBeInstanceOf(CacheNetworkError);
    });
  });

  describe("networkFirst", () => {
    it("should return network response and update cache when network succeeds", async () => {
      const manager = new DefaultCacheManager({
        cacheName: "strategy-cache",
      });

      vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("network-data", { status: 200 }));

      const result = await networkFirst({
        request: new Request("http://localhost/network-first-success"),
        cacheName: "strategy-cache",
        manager,
      });

      const cached = await manager.match("/network-first-success");

      expect(result.source).toBe("network");
      expect(await result.response.text()).toBe("network-data");
      expect(cached).toBeDefined();
      expect(await cached?.text()).toBe("network-data");
    });

    it("should fallback to cache when network fails and cache exists", async () => {
      const manager = new DefaultCacheManager({
        cacheName: "strategy-cache",
      });

      await manager.put("/network-first-fallback", new Response("cached-fallback", { status: 200 }));

      vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network down"));

      const result = await networkFirst({
        request: new Request("http://localhost/network-first-fallback"),
        cacheName: "strategy-cache",
        manager,
      });

      expect(result.source).toBe("cache");
      expect(await result.response.text()).toBe("cached-fallback");
    });

    it("should throw CacheNetworkError when network fails and cache is missing", async () => {
      const manager = new DefaultCacheManager({
        cacheName: "strategy-cache",
      });

      vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network down"));

      await expect(
        networkFirst({
          request: new Request("http://localhost/network-first-fail"),
          cacheName: "strategy-cache",
          manager,
        }),
      ).rejects.toBeInstanceOf(CacheNetworkError);
    });
  });

  describe("staleWhileRevalidate", () => {
    it("should return cached response immediately when cache exists", async () => {
      const manager = new DefaultCacheManager({
        cacheName: "strategy-cache",
      });

      await manager.put("/swr-cache-hit", new Response("stale-cache", { status: 200 }));

      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("fresh-network", { status: 200 }));

      const result = await staleWhileRevalidate({
        request: new Request("http://localhost/swr-cache-hit"),
        cacheName: "strategy-cache",
        manager,
      });

      expect(result.source).toBe("cache");
      expect(await result.response.text()).toBe("stale-cache");
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it("should fetch network and cache response when cache does not exist", async () => {
      const manager = new DefaultCacheManager({
        cacheName: "strategy-cache",
      });

      vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("fresh-network", { status: 200 }));

      const result = await staleWhileRevalidate({
        request: new Request("http://localhost/swr-cache-miss"),
        cacheName: "strategy-cache",
        manager,
      });

      const cached = await manager.match("/swr-cache-miss");

      expect(result.source).toBe("network");
      expect(await result.response.text()).toBe("fresh-network");
      expect(cached).toBeDefined();
      expect(await cached?.text()).toBe("fresh-network");
    });

    it("should throw CacheNetworkError when cache is missing and network fails", async () => {
      const manager = new DefaultCacheManager({
        cacheName: "strategy-cache",
      });

      vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network down"));

      await expect(
        staleWhileRevalidate({
          request: new Request("http://localhost/swr-error"),
          cacheName: "strategy-cache",
          manager,
        }),
      ).rejects.toBeInstanceOf(CacheNetworkError);
    });

    it("should silently ignore background revalidation failure when cache exists", async () => {
      const manager = new DefaultCacheManager({
        cacheName: "strategy-cache",
      });

      await manager.put("/swr-silent-fail", new Response("cached-response", { status: 200 }));

      vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network down"));

      const result = await staleWhileRevalidate({
        request: new Request("http://localhost/swr-silent-fail"),
        cacheName: "strategy-cache",
        manager,
      });

      expect(result.source).toBe("cache");
      expect(await result.response.text()).toBe("cached-response");
    });
  });
});
