import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCache } from "../../src/cache/useCache";
import { CacheNetworkError } from "../../src/core/errors";
import { installMockCacheStorage, uninstallMockCacheStorage } from "./test-utils";
import { CoreModule } from "../../src";

describe("useCache", () => {
  beforeEach(() => {
    installMockCacheStorage();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  afterEach(() => {
    uninstallMockCacheStorage();
    vi.restoreAllMocks();
  });

  it("should expose all expected public methods", () => {
    const cache = useCache();

    expect(cache).toHaveProperty("match");
    expect(cache).toHaveProperty("put");
    expect(cache).toHaveProperty("remove");
    expect(cache).toHaveProperty("clear");
    expect(cache).toHaveProperty("invalidate");
    expect(cache).toHaveProperty("cacheFirst");
    expect(cache).toHaveProperty("networkFirst");
    expect(cache).toHaveProperty("staleWhileRevalidate");
    expect(cache).toHaveProperty("fetchWithStrategy");
  });

  it("should put and match response through wrapper API", async () => {
    const cache = useCache({
      cacheName: "use-cache-test",
    });

    await cache.put("/wrapper-match", new Response("wrapped-response", { status: 200 }));

    const matched = await cache.match("/wrapper-match");

    expect(matched).toBeDefined();
    expect(await matched?.text()).toBe("wrapped-response");
  });

  it("should remove cached response through wrapper API", async () => {
    const cache = useCache({
      cacheName: "use-cache-test",
    });

    await cache.put("/remove-me", new Response("delete-target", { status: 200 }));

    const removed = await cache.remove("/remove-me");
    const matched = await cache.match("/remove-me");

    expect(removed).toBe(true);
    expect(matched).toBeUndefined();
  });

  it("should clear cache through wrapper API", async () => {
    const cache = useCache({
      cacheName: "use-cache-test",
    });

    await cache.put("/a", new Response("A", { status: 200 }));
    await cache.put("/b", new Response("B", { status: 200 }));

    const cleared = await cache.clear();
    const a = await cache.match("/a");
    const b = await cache.match("/b");

    expect(cleared).toBe(true);
    expect(a).toBeUndefined();
    expect(b).toBeUndefined();
  });

  it("should invalidate multiple requests through wrapper API", async () => {
    const cache = useCache({
      cacheName: "use-cache-test",
    });

    await cache.put("/a", new Response("A", { status: 200 }));
    await cache.put("/b", new Response("B", { status: 200 }));
    await cache.put("/c", new Response("C", { status: 200 }));

    await cache.invalidate(["/a", "/b"]);

    const a = await cache.match("/a");
    const b = await cache.match("/b");
    const c = await cache.match("/c");

    expect(a).toBeUndefined();
    expect(b).toBeUndefined();
    expect(c).toBeDefined();
    expect(await c?.text()).toBe("C");
  });

  it("should use cacheFirst strategy through wrapper API", async () => {
    const cache = useCache({
      cacheName: "use-cache-test",
    });

    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("cache-first-network", { status: 200 }));

    const result = await cache.cacheFirst("/cache-first-wrapper");

    const cached = await cache.match("/cache-first-wrapper");

    expect(result.source).toBe("network");
    expect(await result.response.text()).toBe("cache-first-network");
    expect(cached).toBeDefined();
    expect(await cached?.text()).toBe("cache-first-network");
  });

  it("should use networkFirst strategy through wrapper API", async () => {
    const cache = useCache({
      cacheName: "use-cache-test",
    });

    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("network-first-response", { status: 200 }));

    const result = await cache.networkFirst("/network-first-wrapper");

    const cached = await cache.match("/network-first-wrapper");

    expect(result.source).toBe("network");
    expect(await result.response.text()).toBe("network-first-response");
    expect(cached).toBeDefined();
    expect(await cached?.text()).toBe("network-first-response");
  });

  it("should use staleWhileRevalidate strategy through wrapper API", async () => {
    const cache = useCache({
      cacheName: "use-cache-test",
    });

    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("swr-response", { status: 200 }));

    const result = await cache.staleWhileRevalidate("/swr-wrapper");

    const cached = await cache.match("/swr-wrapper");

    expect(result.source).toBe("network");
    expect(await result.response.text()).toBe("swr-response");
    expect(cached).toBeDefined();
    expect(await cached?.text()).toBe("swr-response");
  });

  it("should use default strategy in fetchWithStrategy when strategy is not provided", async () => {
    const cache = useCache({
      cacheName: "use-cache-test",
      defaultStrategy: "network-first",
    });

    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("default-strategy-response", { status: 200 }));

    const result = await cache.fetchWithStrategy("/default-strategy");

    expect(result.source).toBe("network");
    expect(await result.response.text()).toBe("default-strategy-response");
  });

  it("should use provided strategy in fetchWithStrategy", async () => {
    const cache = useCache({
      cacheName: "use-cache-test",
      defaultStrategy: "cache-first",
    });

    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("explicit-strategy-response", { status: 200 }));

    const result = await cache.fetchWithStrategy("/explicit-strategy", {
      strategy: "network-first",
    });

    expect(result.source).toBe("network");
    expect(await result.response.text()).toBe("explicit-strategy-response");
  });

  it("should respect custom cacheName in strategy options", async () => {
    const cache = useCache({
      cacheName: "default-cache",
    });

    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("custom-cache-response", { status: 200 }));

    await cache.fetchWithStrategy("/custom-cache-key", {
      strategy: "cache-first",
      cacheName: "special-cache",
    });

    const defaultMatch = await cache.match("/custom-cache-key");

    expect(defaultMatch).toBeUndefined();
  });

  it("should throw CacheNetworkError when fetchWithStrategy fails with network-first and no cache fallback", async () => {
    const cache = useCache({
      cacheName: "use-cache-test",
      defaultStrategy: "network-first",
    });

    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network down"));

    await expect(cache.fetchWithStrategy("/network-error")).rejects.toBeInstanceOf(CacheNetworkError);
  });

  it("should honor ttl passed to put wrapper", async () => {
    vi.useFakeTimers();

    const cache = useCache({
      cacheName: "use-cache-test",
    });

    await cache.put("/ttl-wrapper", new Response("ttl-wrapper-response", { status: 200 }), 1000);

    vi.advanceTimersByTime(1500);

    const matched = await cache.match("/ttl-wrapper");

    expect(matched).toBeUndefined();
  });

  it("should consume cache config from CoreModule when local config is not provided", async () => {
    CoreModule.init({
      cache: {
        cacheName: "core-cache",
        defaultStrategy: "network-first",
      },
    });

    const cache = useCache();

    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("core-config-response", { status: 200 }));

    const result = await cache.fetchWithStrategy("/core-config-strategy");

    expect(result.source).toBe("network");
    expect(await result.response.text()).toBe("core-config-response");
  });

  it("should allow local config to override CoreModule cache config", async () => {
    CoreModule.init({
      cache: {
        cacheName: "core-cache",
        defaultStrategy: "cache-first",
      },
    });

    const cache = useCache({
      cacheName: "local-cache",
      defaultStrategy: "network-first",
    });

    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("override-response", { status: 200 }));

    const result = await cache.fetchWithStrategy("/override-config");

    expect(result.source).toBe("network");
    expect(await result.response.text()).toBe("override-response");
  });

  it("should fallback to default cache config when CoreModule is not initialized", async () => {
    CoreModule.reset();

    const cache = useCache();

    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("default-fallback-response", { status: 200 }));

    const result = await cache.fetchWithStrategy("/default-fallback");

    expect(result.source).toBe("network");
    expect(await result.response.text()).toBe("default-fallback-response");
  });
});
