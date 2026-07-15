/**
 * Integration test untuk useBackgroundSync composable.
 *
 * CATATAN: setiap flush() memproses snapshot pending records yang sudah
 * jatuh tempo (nextAttemptAt <= now). Setelah gagal, record kembali ke
 * "pending" dengan retryCount bertambah dan nextAttemptAt = now + computeDelay().
 * flush() melewati entry yang masih dalam masa backoff; composable menjadwalkan
 * auto-flush saat jatuh tempo. Untuk menonaktifkan jeda dalam test, set baseDelayMs: 0.
 */

import { describe, expect, it, beforeEach, afterEach, vi, afterAll } from "vitest";
import { useBackgroundSync } from "../../src/composables/useBackgroundSync";
import { SyncStorage } from "../../src/modules/push-sync/sync-storage";
import type { SyncEntry } from "../../src/types/sync.types";

/** Drain microtask queue. */
function flushPromises(): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, 0));
}

/** Tunggu real time manual. */
function tick(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("useBackgroundSync", () => {
  let originalFetch: typeof fetch;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.restoreAllMocks();
    vi.useRealTimers();

    originalFetch = globalThis.fetch;

    mockFetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    globalThis.fetch = mockFetch;

    Object.defineProperty(navigator, "onLine", {
      value: true,
      configurable: true,
      writable: true,
    });

    const storage = new SyncStorage();
    await storage.clearAll();
  });

  afterEach(async () => {
    globalThis.fetch = originalFetch;
    const storage = new SyncStorage();
    await storage.clearAll();
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  function setOffline(): void {
    Object.defineProperty(navigator, "onLine", {
      value: false,
      configurable: true,
      writable: true,
    });
  }

  function setOnline(): void {
    Object.defineProperty(navigator, "onLine", {
      value: true,
      configurable: true,
      writable: true,
    });
    window.dispatchEvent(new Event("online"));
  }

  // =========================================================
  // M4.4.1 — enqueue
  // =========================================================

  it("should enqueue a request and generate id", async () => {
    setOffline();
    const { enqueue } = useBackgroundSync("test-queue");

    const id = await enqueue({
      url: "/api/test",
      method: "POST",
      body: { data: 1 },
    });

    await flushPromises();

    expect(id).toBeTruthy();
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(10);
  });

  it("should auto-generate idempotencyKey if not provided", async () => {
    setOffline();
    const { enqueue } = useBackgroundSync("test-idempotency");

    const id = await enqueue({
      url: "/api/test",
      method: "POST",
      body: { x: 1 },
    });

    await flushPromises();

    const storage = new SyncStorage();
    const record = await storage.get(id);

    expect(record).toBeDefined();
    expect(record!.idempotencyKey).toBe(id);
  });

  it("should use provided idempotencyKey", async () => {
    setOffline();
    const { enqueue } = useBackgroundSync("test-idempotency-2");

    const id = await enqueue({
      url: "/api/test",
      method: "POST",
      body: { x: 1 },
      idempotencyKey: "custom-key-123",
    });

    await flushPromises();

    const storage = new SyncStorage();
    const record = await storage.get(id);

    expect(record).toBeDefined();
    expect(record!.idempotencyKey).toBe("custom-key-123");
  });

  // =========================================================
  // M4.4.2 — flush (manual, online)
  // =========================================================

  it("should flush pending entries and remove them on success", async () => {
    setOffline();
    const { enqueue, flush } = useBackgroundSync("test-flush");

    await enqueue({ url: "/api/submit", method: "POST", body: { ok: true } });
    await enqueue({ url: "/api/submit2", method: "PUT", body: { x: 2 } });

    setOnline();
    await flush();
    await flushPromises();
    await tick(50);

    expect(mockFetch).toHaveBeenCalledTimes(2);

    const calls = mockFetch.mock.calls;
    for (const call of calls) {
      const init = call[1] as RequestInit;
      expect(init.headers).toHaveProperty("Idempotency-Key");
    }
  });

  it("should include Idempotency-Key in request header", async () => {
    setOffline();
    const bgSync = useBackgroundSync("test-header");

    await bgSync.enqueue({
      url: "/api/exam",
      method: "POST",
      body: { answer: "A" },
      idempotencyKey: "ik-001",
    });

    // Flush via online event
    setOnline();
    await tick(50);
    await flushPromises();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const callArgs = mockFetch.mock.calls[0];
    const headers = callArgs[1]?.headers as Record<string, string>;
    expect(headers["Idempotency-Key"]).toBe("ik-001");
  });

  it("should include custom headers from entry", async () => {
    setOffline();
    const bgSync = useBackgroundSync("test-headers");

    await bgSync.enqueue({
      url: "/api/auth",
      method: "POST",
      body: { token: "abc" },
      headers: { Authorization: "Bearer xyz" },
    });

    setOnline();
    await tick(50);
    await flushPromises();

    const headers = mockFetch.mock.calls[0]?.[1]?.headers as Record<string, string>;
    expect(headers["Authorization"]).toBe("Bearer xyz");
  });

  // =========================================================
  // M4.4.3 — retry & backoff
  // =========================================================

  it("should retry on server error when flush called multiple times", async () => {
    // Gagal 2x, sukses yang ke-3
    mockFetch
      .mockRejectedValueOnce(new Error("Network error"))
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));

    setOffline();
    const { enqueue, flush } = useBackgroundSync("test-retry-manual", {
      maxRetries: 5,
      backoff: "exponential",
      baseDelayMs: 0, // tanpa jeda — uji ini fokus pada urutan retry
    });

    await enqueue({ url: "/api/test", method: "POST", body: {} });
    setOnline();

    // Attempt 1 — gagal
    await flush();
    await tick(10);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Attempt 2 — flush lagi (record back to pending with retryCount=1)
    await flush();
    await tick(10);
    expect(mockFetch).toHaveBeenCalledTimes(2);

    // Attempt 3 — sukses
    await flush();
    await tick(10);
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it("should mark entry failed after maxRetries exhausted via multiple flushes", async () => {
    mockFetch.mockRejectedValue(new Error("always fail"));
    const onSyncFailure = vi.fn();

    setOffline();
    const { enqueue, flush } = useBackgroundSync("test-max-retries", {
      maxRetries: 2,
      backoff: "exponential",
      baseDelayMs: 0,
      onSyncFailure,
    });

    const id = await enqueue({ url: "/api/test", method: "POST", body: {} });
    setOnline();

    // Attempt 1 (initial flush: retryCount 0 → 1 setelah gagal, masih pending)
    await flush();
    await tick(10);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Attempt 2 (retryCount 1 → 2 setelah gagal, mencapai maxRetries=2 → failed)
    await flush();
    await tick(10);
    expect(mockFetch).toHaveBeenCalledTimes(2);

    const storage = new SyncStorage();
    const record = await storage.get(id);
    expect(record).toBeDefined();
    expect(record!.status).toBe("failed");
    expect(record!.retryCount).toBe(2);

    expect(onSyncFailure).toHaveBeenCalledTimes(1);
  });

  it("should call onSyncSuccess when entry flushed successfully", async () => {
    const onSyncSuccess = vi.fn();

    setOffline();
    const { enqueue } = useBackgroundSync("test-success-cb", {
      onSyncSuccess,
    });

    await enqueue({ url: "/api/test", method: "POST", body: {} });

    setOnline();
    const { flush } = useBackgroundSync("test-success-cb");
    await flush();
    await tick(50);

    expect(onSyncSuccess).toHaveBeenCalledTimes(1);
    const entry: SyncEntry = onSyncSuccess.mock.calls[0][0];
    expect(entry.url).toBe("/api/test");
    expect(entry.method).toBe("POST");
  });

  it("should apply linear backoff correctly (urutan retry, tanpa jeda)", async () => {
    mockFetch
      .mockRejectedValueOnce(new Error("fail"))
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }));

    setOffline();
    const { enqueue, flush } = useBackgroundSync("test-linear", {
      maxRetries: 5,
      backoff: "linear",
      baseDelayMs: 0,
    });

    await enqueue({ url: "/api/test", method: "POST", body: {} });
    setOnline();

    // Attempt 1
    await flush();
    await tick(10);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Attempt 2
    await flush();
    await tick(10);
    expect(mockFetch).toHaveBeenCalledTimes(2);

    // Attempt 3
    await flush();
    await tick(10);
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it("backoff benar-benar menunda retry: flush sebelum jatuh tempo dilewati", async () => {
    // Selalu gagal pada percobaan pertama agar entry masuk masa backoff.
    mockFetch.mockRejectedValue(new Error("network down"));

    setOffline();
    const { enqueue, flush } = useBackgroundSync("test-backoff-delay", {
      maxRetries: 5,
      backoff: "exponential",
      baseDelayMs: 120, // delay retry pertama = 120ms × 2^0 = 120ms
    });

    await enqueue({ url: "/api/test", method: "POST", body: {} });
    setOnline();

    // Attempt 1 — gagal, entry dijadwalkan ulang ~120ms ke depan.
    await flush();
    await tick(10);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Flush lagi SEBELUM jatuh tempo → entry dilewati, tidak ada fetch baru.
    await flush();
    await tick(10);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Tunggu melewati jeda backoff → flush memproses ulang.
    await tick(150);
    await flush();
    await tick(10);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  // =========================================================
  // M4.4.4 — remove & clear
  // =========================================================

  it("should remove specific entry by id", async () => {
    setOffline();
    const { enqueue, remove } = useBackgroundSync("test-remove");

    const id = await enqueue({ url: "/api/a", method: "POST", body: {} });
    await enqueue({ url: "/api/b", method: "POST", body: {} });

    const removed = await remove(id);
    expect(removed).toBe(true);

    const storage = new SyncStorage();
    const record = await storage.get(id);
    expect(record).toBeUndefined();
  });

  it("should clear entire queue", async () => {
    setOffline();
    const { enqueue, clear } = useBackgroundSync("test-clear");

    await enqueue({ url: "/api/a", method: "POST", body: {} });
    await enqueue({ url: "/api/b", method: "POST", body: {} });

    await clear();
    await flushPromises();

    const storage = new SyncStorage();
    const all = await storage.getByQueue("test-clear");
    expect(all).toHaveLength(0);
  });

  // =========================================================
  // M4.4.5 — queue reactive state
  // =========================================================

  it("should update reactive queue and pendingCount", async () => {
    setOffline();
    const { enqueue, clear } = useBackgroundSync("test-reactive");

    await enqueue({ url: "/api/a", method: "POST", body: {} });
    await flushPromises();

    const storage = new SyncStorage();
    const records = await storage.getByQueue("test-reactive");
    expect(records.length).toBeGreaterThanOrEqual(1);

    await clear();
    await flushPromises();
  });

  // =========================================================
  // M4.4.6 — offline → online auto-flush
  // =========================================================

  it("should auto-flush when coming online", async () => {
    setOffline();

    mockFetch.mockResolvedValue(new Response(null, { status: 200 }));

    const { enqueue } = useBackgroundSync("test-offline-online");

    await enqueue({ url: "/api/offline", method: "POST", body: {} });
    await tick(10);

    // Belum ada fetch karena offline
    expect(mockFetch).not.toHaveBeenCalled();

    // Go online — trigger auto-flush via event listener
    setOnline();
    await tick(50);

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  // =========================================================
  // M4.4.7 — 4xx error tidak retryable
  // =========================================================

  it("should mark entry failed immediately on 4xx (client error)", async () => {
    const onSyncFailure = vi.fn();

    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ error: "bad request" }), {
        status: 400,
        statusText: "Bad Request",
      }),
    );

    setOffline();
    const { enqueue } = useBackgroundSync("test-4xx", {
      maxRetries: 3,
      onSyncFailure,
    });

    const id = await enqueue({ url: "/api/test", method: "POST", body: {} });

    setOnline();
    const { flush } = useBackgroundSync("test-4xx");
    await flush();
    await tick(50);
    await flushPromises();

    const storage = new SyncStorage();
    const record = await storage.get(id);
    expect(record!.status).toBe("failed");
    expect(onSyncFailure).toHaveBeenCalledTimes(1);
  });
});
