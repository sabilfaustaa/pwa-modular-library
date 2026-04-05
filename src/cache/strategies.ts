import { CacheNetworkError, CacheStrategyError } from "../core/errors";
import type { CacheStrategy, StrategyContext, StrategyResult } from "./types";

async function fetchAndCache(context: StrategyContext): Promise<Response> {
  const networkResponse = await fetch(context.request);

  await context.manager.put(context.request, networkResponse.clone(), context.cacheName, context.ttl);

  return networkResponse;
}

export async function cacheFirst(context: StrategyContext): Promise<StrategyResult> {
  const cachedResponse = await context.manager.match(context.request, context.matchOptions, context.cacheName);

  if (cachedResponse) {
    return {
      response: cachedResponse,
      source: "cache",
    };
  }

  try {
    const networkResponse = await fetchAndCache(context);

    return {
      response: networkResponse,
      source: "network",
    };
  } catch (error) {
    throw new CacheNetworkError(`cache-first strategy failed for request: ${context.request.url}`, error);
  }
}

export async function networkFirst(context: StrategyContext): Promise<StrategyResult> {
  try {
    const networkResponse = await fetchAndCache(context);

    return {
      response: networkResponse,
      source: "network",
    };
  } catch (error) {
    const cachedResponse = await context.manager.match(context.request, context.matchOptions, context.cacheName);

    if (cachedResponse) {
      return {
        response: cachedResponse,
        source: "cache",
      };
    }

    throw new CacheNetworkError(
      `network-first strategy failed and no cache fallback found for request: ${context.request.url}`,
      error,
    );
  }
}

export async function staleWhileRevalidate(context: StrategyContext): Promise<StrategyResult> {
  const cachedResponse = await context.manager.match(context.request, context.matchOptions, context.cacheName);

  if (cachedResponse) {
    void fetchAndCache(context).catch(() => {
      // silent fail for background revalidation
    });

    return {
      response: cachedResponse,
      source: "cache",
    };
  }

  try {
    const networkResponse = await fetchAndCache(context);

    return {
      response: networkResponse,
      source: "network",
    };
  } catch (error) {
    throw new CacheNetworkError(`stale-while-revalidate strategy failed for request: ${context.request.url}`, error);
  }
}

export function resolveStrategy(strategy: CacheStrategy): (context: StrategyContext) => Promise<StrategyResult> {
  switch (strategy) {
    case "cache-first":
      return cacheFirst;
    case "network-first":
      return networkFirst;
    case "stale-while-revalidate":
      return staleWhileRevalidate;
    default:
      throw new CacheStrategyError(`Unsupported cache strategy: ${strategy}`);
  }
}
