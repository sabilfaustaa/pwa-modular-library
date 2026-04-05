export interface StorageAdapter<T = unknown> {
  get(key: string): Promise<T | undefined>;
  set(key: string, value: T): Promise<void>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<void>;
  getAll(): Promise<T[]>;
  keys(): Promise<string[]>;
  has?(key: string): Promise<boolean>;
}
