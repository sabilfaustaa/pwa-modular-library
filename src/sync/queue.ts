import { DEFAULT_MAX_RETRIES } from "../core/constants";
import type { StorageAdapter } from "../storage/adapter";
import type { SyncQueueConfig, SyncTask, SyncTaskExecutor } from "./types";

export class SyncQueue<T = unknown> {
  private readonly storage: StorageAdapter<SyncTask<T>>;
  private readonly maxRetries: number;
  private isProcessing = false;
  private sequenceCounter = 0;

  constructor(storage: StorageAdapter<SyncTask<T>>, config?: SyncQueueConfig) {
    this.storage = storage;
    this.maxRetries = config?.maxRetries ?? DEFAULT_MAX_RETRIES;
  }

  async enqueue(payload: T): Promise<SyncTask<T>> {
    const now = Date.now();

    const task: SyncTask<T> = {
      id: this.generateTaskId(),
      payload,
      status: "pending",
      retries: 0,
      createdAt: now,
      updatedAt: now,
      sequence: this.sequenceCounter++,
    };

    await this.storage.set(task.id, task);
    return task;
  }

  async getQueue(): Promise<SyncTask<T>[]> {
    const tasks = await this.storage.getAll();
    return tasks.sort((a, b) => a.sequence - b.sequence);
  }

  async processQueue(executor: SyncTaskExecutor<T>): Promise<void> {
    if (this.isProcessing) return;

    this.isProcessing = true;

    try {
      const tasks = await this.getQueue();

      for (const task of tasks) {
        if (task.status === "completed") continue;
        await this.processTask(task, executor);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  async retryFailedTasks(executor: SyncTaskExecutor<T>): Promise<void> {
    if (this.isProcessing) return;

    this.isProcessing = true;

    try {
      const tasks = await this.getQueue();
      const failedTasks = tasks.filter((task) => task.status === "failed");

      for (const task of failedTasks) {
        await this.processTask(
          {
            ...task,
            status: "pending",
            retries: 0,
            updatedAt: Date.now(),
          },
          executor,
        );
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private async processTask(task: SyncTask<T>, executor: SyncTaskExecutor<T>): Promise<void> {
    const processingTask: SyncTask<T> = {
      ...task,
      status: "processing",
      updatedAt: Date.now(),
    };

    await this.storage.set(processingTask.id, processingTask);

    try {
      await executor(processingTask);
      await this.storage.delete(processingTask.id);
    } catch {
      const nextRetries = processingTask.retries + 1;
      const failedStatus = nextRetries >= this.maxRetries ? "failed" : "pending";

      const failedTask: SyncTask<T> = {
        ...processingTask,
        retries: nextRetries,
        status: failedStatus,
        updatedAt: Date.now(),
      };

      await this.storage.set(failedTask.id, failedTask);
    }
  }

  private generateTaskId(): string {
    return `sync_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }
}
