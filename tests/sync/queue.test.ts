import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { IndexedDBStorage } from "../../src/storage/indexeddb";
import { SyncQueue } from "../../src/sync/queue";
import type { SyncTask } from "../../src/sync/types";

describe("SyncQueue", () => {
  let storage: IndexedDBStorage<SyncTask<{ value: string }>>;
  let queue: SyncQueue<{ value: string }>;

  beforeEach(async () => {
    storage = new IndexedDBStorage<SyncTask<{ value: string }>>({
      dbName: "sync-test-db",
      storeName: "sync-test-store",
    });

    await storage.clear();
    queue = new SyncQueue(storage, { maxRetries: 2 });
  });

  it("should enqueue task as pending", async () => {
    const task = await queue.enqueue({ value: "task-1" });

    expect(task.status).toBe("pending");
    expect(task.retries).toBe(0);

    const stored = await storage.get(task.id);
    expect(stored).toBeDefined();
    expect(stored?.payload).toEqual({ value: "task-1" });
  });

  it("should return queue in FIFO order", async () => {
    const task1 = await queue.enqueue({ value: "first" });
    const task2 = await queue.enqueue({ value: "second" });

    const tasks = await queue.getQueue();

    expect(tasks[0].id).toBe(task1.id);
    expect(tasks[1].id).toBe(task2.id);
  });

  it("should process and remove successful tasks", async () => {
    await queue.enqueue({ value: "task-1" });

    const executor = vi.fn().mockResolvedValue(undefined);

    await queue.processQueue(executor);

    const tasks = await queue.getQueue();
    expect(executor).toHaveBeenCalledTimes(1);
    expect(tasks).toEqual([]);
  });

  it("should retry failed task and keep it in queue", async () => {
    await queue.enqueue({ value: "task-1" });

    const executor = vi.fn().mockRejectedValue(new Error("failed once"));

    await queue.processQueue(executor);

    const tasks = await queue.getQueue();

    expect(executor).toHaveBeenCalledTimes(1);
    expect(tasks).toHaveLength(1);
    expect(tasks[0].status).toBe("pending");
    expect(tasks[0].retries).toBe(1);
  });

  it("should mark task as failed after reaching max retries", async () => {
    await queue.enqueue({ value: "task-1" });

    const executor = vi.fn().mockRejectedValue(new Error("always fail"));

    await queue.processQueue(executor);
    await queue.processQueue(executor);

    const tasks = await queue.getQueue();

    expect(executor).toHaveBeenCalledTimes(2);
    expect(tasks).toHaveLength(1);
    expect(tasks[0].status).toBe("failed");
    expect(tasks[0].retries).toBe(2);
  });

  it("should retry failed tasks explicitly", async () => {
    await queue.enqueue({ value: "task-1" });

    const failExecutor = vi.fn().mockRejectedValue(new Error("fail"));
    await queue.processQueue(failExecutor);
    await queue.processQueue(failExecutor);

    let tasks = await queue.getQueue();
    expect(tasks[0].status).toBe("failed");

    const successExecutor = vi.fn().mockResolvedValue(undefined);
    await queue.retryFailedTasks(successExecutor);

    tasks = await queue.getQueue();
    expect(successExecutor).toHaveBeenCalledTimes(1);
    expect(tasks).toEqual([]);
  });

  it("should prevent concurrent processing", async () => {
    await queue.enqueue({ value: "task-1" });

    let activeExecutions = 0;
    let maxConcurrentExecutions = 0;

    const executor = vi.fn().mockImplementation(async () => {
      activeExecutions += 1;
      maxConcurrentExecutions = Math.max(maxConcurrentExecutions, activeExecutions);

      await new Promise((resolve) => setTimeout(resolve, 10));

      activeExecutions -= 1;
    });

    await Promise.all([queue.processQueue(executor), queue.processQueue(executor)]);

    expect(executor).toHaveBeenCalledTimes(1);
    expect(maxConcurrentExecutions).toBe(1);

    const tasks = await queue.getQueue();
    expect(tasks).toEqual([]);
  });
});
