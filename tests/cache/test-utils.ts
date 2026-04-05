type CacheStore = Map<string, Response>;

function toAbsoluteUrl(input: string): string {
  return new URL(input, "http://localhost").toString();
}

function normalizeRequestKey(input: RequestInfo | URL): string {
  if (input instanceof Request) {
    return `${input.method.toUpperCase()}:${input.url}`;
  }

  if (input instanceof URL) {
    return `GET:${input.toString()}`;
  }

  return `GET:${toAbsoluteUrl(String(input))}`;
}

function toUrlFromKey(key: string): string {
  const separatorIndex = key.indexOf(":");
  return key.slice(separatorIndex + 1);
}

class MockCache implements Cache {
  private readonly store: CacheStore;

  constructor(store?: CacheStore) {
    this.store = store ?? new Map<string, Response>();
  }

  async add(_request: RequestInfo | URL): Promise<void> {
    throw new Error("Method not implemented in mock.");
  }

  async addAll(_requests: RequestInfo[]): Promise<void> {
    throw new Error("Method not implemented in mock.");
  }

  async delete(request: RequestInfo | URL): Promise<boolean> {
    const key = normalizeRequestKey(request);
    return this.store.delete(key);
  }

  async keys(request?: RequestInfo | URL, _options?: CacheQueryOptions): Promise<readonly Request[]> {
    const keys = Array.from(this.store.keys()).map((entry) => {
      return new Request(toUrlFromKey(entry));
    });

    if (!request) {
      return keys;
    }

    const requestKey = normalizeRequestKey(request);
    return this.store.has(requestKey) ? [new Request(toUrlFromKey(requestKey))] : [];
  }

  async match(request: RequestInfo | URL, _options?: CacheQueryOptions): Promise<Response | undefined> {
    const key = normalizeRequestKey(request);
    const response = this.store.get(key);

    return response ? response.clone() : undefined;
  }

  async matchAll(request?: RequestInfo | URL, _options?: CacheQueryOptions): Promise<readonly Response[]> {
    if (!request) {
      return Array.from(this.store.values()).map((response) => response.clone());
    }

    const matched = await this.match(request);
    return matched ? [matched] : [];
  }

  async put(request: RequestInfo | URL, response: Response): Promise<void> {
    const key = normalizeRequestKey(request);
    this.store.set(key, response.clone());
  }
}

class MockCacheStorage implements CacheStorage {
  private readonly cachesMap = new Map<string, MockCache>();

  async delete(cacheName: string): Promise<boolean> {
    return this.cachesMap.delete(cacheName);
  }

  async has(cacheName: string): Promise<boolean> {
    return this.cachesMap.has(cacheName);
  }

  async keys(): Promise<string[]> {
    return Array.from(this.cachesMap.keys());
  }

  async match(request: RequestInfo | URL, options?: MultiCacheQueryOptions): Promise<Response | undefined> {
    const cacheName = options?.cacheName;

    if (cacheName) {
      const cache = this.cachesMap.get(cacheName);
      return cache?.match(request);
    }

    for (const cache of this.cachesMap.values()) {
      const response = await cache.match(request);
      if (response) {
        return response;
      }
    }

    return undefined;
  }

  async open(cacheName: string): Promise<Cache> {
    if (!this.cachesMap.has(cacheName)) {
      this.cachesMap.set(cacheName, new MockCache());
    }

    return this.cachesMap.get(cacheName)!;
  }
}

export function installMockCacheStorage(): MockCacheStorage {
  const mockCacheStorage = new MockCacheStorage();

  Object.defineProperty(globalThis, "caches", {
    value: mockCacheStorage,
    configurable: true,
    writable: true,
  });

  return mockCacheStorage;
}

export function uninstallMockCacheStorage(): void {
  Reflect.deleteProperty(globalThis, "caches");
}
