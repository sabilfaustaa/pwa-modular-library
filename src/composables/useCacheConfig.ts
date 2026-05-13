/**
 * useCacheConfig — Konfigurasi strategi caching deklaratif berbasis rules.
 *
 * @module composables/useCacheConfig
 */

import { ref, readonly, type Ref } from "vue";
import { RuleRegistry } from "../modules/caching/rule-registry";
import { broadcastRules, listenForRuleRequest } from "../modules/caching/sw-sync";
import { DefaultCacheManager } from "../modules/caching/manager";
import { logger } from "../utils/logger";
import type { CacheRule, CacheStrategy, UseCacheConfigReturn } from "../types/cache.types";

export function useCacheConfig(initialRules?: CacheRule[]): UseCacheConfigReturn {
  // Rule registry utama
  const registry = new RuleRegistry(initialRules);
  const rules = ref<CacheRule[]>([...registry.getAll()]);

  // Cache manager default (untuk operasi clear, size, dll)
  const manager = new DefaultCacheManager();

  // Sinkronisasi aturan ke rules ref
  function syncRules(): void {
    rules.value = [...registry.getAll()];
  }

  // Broadcast ke SW
  function syncToSW(): void {
    broadcastRules(rules.value);
  }

  // Dengarkan permintaan rules dari SW
  function startListening(): void {
    const unlisten = listenForRuleRequest(() => registry.getAll());
    // Cleanup akan dipanggil saat komponen unmount (TODO: integrasi Vue lifecycle)
    void unlisten;
  }

  /**
   * Tambah aturan caching.
   * Jika pattern sudah ada, replace.
   */
  function addRule(rule: CacheRule): void {
    registry.addRule(rule);
    syncRules();
    syncToSW();
    logger.info(`Cache rule added: ${String(rule.pattern)}, strategy: ${rule.strategy}`);
  }

  /**
   * Hapus aturan berdasarkan pattern.
   */
  function removeRule(pattern: string | RegExp): boolean {
    const result = registry.removeRule(pattern);
    if (result) {
      syncRules();
      syncToSW();
      logger.info(`Cache rule removed: ${String(pattern)}`);
    }
    return result;
  }

  /**
   * Bersihkan semua cache entries.
   */
  async function clearAll(): Promise<void> {
    await manager.clear();
    registry.clearAll();
    syncRules();
    syncToSW();
    logger.info("All cache rules and entries cleared");
  }

  /**
   * Bersihkan cache spesifik berdasarkan nama cache.
   * Jika cacheName tidak diberikan, bersihkan cache default.
   */
  async function clear(cacheName: string): Promise<boolean> {
    const result = await manager.clear(cacheName);
    if (result) {
      logger.info(`Cache cleared: ${cacheName}`);
    }
    return result;
  }

  /**
   * Hitung total ukuran cache (estimasi berdasarkan jumlah entry).
   * Cache API tidak menyediakan size langsung; return jumlah entry.
   */
  async function size(): Promise<number> {
    const keys = await manager.keys();
    return keys.length;
  }

  // Mulai listener untuk SW cold-start request
  startListening();

  return {
    rules: readonly(rules) as Readonly<Ref<CacheRule[]>>,
    addRule,
    removeRule,
    clearAll,
    clear,
    size,
  };
}

export type { CacheRule, CacheStrategy, UseCacheConfigReturn };
