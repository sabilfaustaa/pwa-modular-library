export type SyncTaskStatus = "pending" | "processing" | "completed" | "failed";

export interface SyncTask<T = unknown> {
  id: string;
  payload: T;
  status: SyncTaskStatus;
  retries: number;
  createdAt: number;
  updatedAt: number;
  sequence: number;
}

export interface SyncQueueConfig {
  maxRetries?: number;
  retryDelay?: number;
}

export type SyncTaskExecutor<T = unknown> = (task: SyncTask<T>) => Promise<void>;
