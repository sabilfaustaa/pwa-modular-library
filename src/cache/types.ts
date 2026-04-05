import type { CacheStrategy } from "../types/config";

export interface CacheMatchOptions {
  ignoreSearch?: boolean;
  ignoreMethod?: boolean;
  ignoreVary?: boolean;
}

export interface CacheFetchOptions {
  strategy?: CacheStrategy;
  cacheName?: string;
  ttl?: number;
  matchOptions?: CacheMatchOptions;
}

export interface StrategyResult {
  response: Response;
  source: "cache" | "network";
}

export interface CacheManager {
  open(cacheName?: string): Promise<Cache>;
  match(request: RequestInfo | URL, options?: CacheMatchOptions, cacheName?: string): Promise<Response | undefined>;
  put(request: RequestInfo | URL, response: Response, cacheName?: string, ttl?: number): Promise<void>;
  delete(request: RequestInfo | URL, cacheName?: string): Promise<boolean>;
  clear(cacheName?: string): Promise<boolean>;
  invalidate(requests: Array<RequestInfo | URL>, cacheName?: string): Promise<void>;
  keys(cacheName?: string): Promise<readonly Request[]>;
}

export interface StrategyContext {
  request: Request;
  cacheName: string;
  ttl?: number;
  matchOptions?: CacheMatchOptions;
  manager: CacheManager;
}

export interface UseCacheReturn {
  match: (request: RequestInfo | URL, options?: CacheMatchOptions) => Promise<Response | undefined>;

  put: (request: RequestInfo | URL, response: Response, ttl?: number) => Promise<void>;

  remove: (request: RequestInfo | URL) => Promise<boolean>;

  clear: () => Promise<boolean>;

  invalidate: (requests: Array<RequestInfo | URL>) => Promise<void>;

  cacheFirst: (request: RequestInfo | URL, options?: Omit<CacheFetchOptions, "strategy">) => Promise<StrategyResult>;

  networkFirst: (request: RequestInfo | URL, options?: Omit<CacheFetchOptions, "strategy">) => Promise<StrategyResult>;

  staleWhileRevalidate: (
    request: RequestInfo | URL,
    options?: Omit<CacheFetchOptions, "strategy">,
  ) => Promise<StrategyResult>;

  fetchWithStrategy: (request: RequestInfo | URL, options?: CacheFetchOptions) => Promise<StrategyResult>;
}
