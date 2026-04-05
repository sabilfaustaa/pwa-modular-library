import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { DefaultCacheManager } from "../../src/cache/manager";
import { CacheNotSupportedError } from "../../src/core/errors";
import { installMockCacheStorage, uninstallMockCacheStorage } from "./test-utils";

describe("DefaultCacheManager", () => {
  beforeEach(() => {
    installMockCacheStorage();
    vi.useRealTimers();
  });

  afterEach(() => {
    uninstallMockCacheStorage();
    vi.restoreAllMocks();
  });

  it("should open cache successfully", async () => {
    const manager = new DefaultCacheManager({
      cacheName: "test-cache",
    });

    const cache = await manager.open();

    expect(cache).toBeDefined();
  });

  it("should put and match cached response successfully", async () => {
    const manager = new DefaultCacheManager({
      cacheName: "test-cache",
    });

    const request = "/api/questions";
    const response = new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });

    await manager.put(request, response);

    const matched = await manager.match(request);

    expect(matched).toBeDefined();
    expect(await matched?.json()).toEqual({ ok: true });
  });

  it("should delete cached response successfully", async () => {
    const manager = new DefaultCacheManager({
      cacheName: "test-cache",
    });

    const request = "/api/delete-me";
    const response = new Response("cached", { status: 200 });

    await manager.put(request, response);

    const deleted = await manager.delete(request);
    const matched = await manager.match(request);

    expect(deleted).toBe(true);
    expect(matched).toBeUndefined();
  });

  it("should clear all cached entries successfully", async () => {
    const manager = new DefaultCacheManager({
      cacheName: "test-cache",
    });

    await manager.put("/a", new Response("A", { status: 200 }));
    await manager.put("/b", new Response("B", { status: 200 }));

    const cleared = await manager.clear();
    const keys = await manager.keys();

    expect(cleared).toBe(true);
    expect(keys).toHaveLength(0);
  });

  it("should invalidate multiple cached requests", async () => {
    const manager = new DefaultCacheManager({
      cacheName: "test-cache",
    });

    await manager.put("/a", new Response("A", { status: 200 }));
    await manager.put("/b", new Response("B", { status: 200 }));
    await manager.put("/c", new Response("C", { status: 200 }));

    await manager.invalidate(["/a", "/b"]);

    const a = await manager.match("/a");
    const b = await manager.match("/b");
    const c = await manager.match("/c");

    expect(a).toBeUndefined();
    expect(b).toBeUndefined();
    expect(c).toBeDefined();
    expect(await c?.text()).toBe("C");
  });

  it("should return undefined for cache miss", async () => {
    const manager = new DefaultCacheManager({
      cacheName: "test-cache",
    });

    const matched = await manager.match("/not-found");

    expect(matched).toBeUndefined();
  });

  it("should not cache non-successful response", async () => {
    const manager = new DefaultCacheManager({
      cacheName: "test-cache",
    });

    await manager.put("/error-response", new Response("bad request", { status: 400 }));

    const matched = await manager.match("/error-response");

    expect(matched).toBeUndefined();
  });

  it("should not cache request with unsupported method", async () => {
    const manager = new DefaultCacheManager({
      cacheName: "test-cache",
      cacheableMethods: ["GET"],
    });

    const request = new Request("http://localhost/submit", {
      method: "POST",
    });

    await manager.put(request, new Response("posted", { status: 200 }));

    const matched = await manager.match(request);

    expect(matched).toBeUndefined();
  });

  it("should expire cached response when ttl is exceeded", async () => {
    vi.useFakeTimers();

    const manager = new DefaultCacheManager({
      cacheName: "test-cache",
    });

    await manager.put("/ttl-test", new Response("ttl-response", { status: 200 }), undefined, 1000);

    vi.advanceTimersByTime(1500);

    const matched = await manager.match("/ttl-test");

    expect(matched).toBeUndefined();
  });

  it("should keep cached response when ttl is not exceeded", async () => {
    vi.useFakeTimers();

    const manager = new DefaultCacheManager({
      cacheName: "test-cache",
    });

    await manager.put("/ttl-valid", new Response("still-valid", { status: 200 }), undefined, 5000);

    vi.advanceTimersByTime(1000);

    const matched = await manager.match("/ttl-valid");

    expect(matched).toBeDefined();
    expect(await matched?.text()).toBe("still-valid");
  });

  it("should throw CacheNotSupportedError when Cache API is unavailable", async () => {
    uninstallMockCacheStorage();

    const manager = new DefaultCacheManager({
      cacheName: "test-cache",
    });

    await expect(manager.open()).rejects.toBeInstanceOf(CacheNotSupportedError);
  });
});
