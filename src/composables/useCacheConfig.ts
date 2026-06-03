/**
 * useCacheConfig — Konfigurasi strategi caching deklaratif berbasis rules.
 *
 * @module composables/useCacheConfig
 */

import { ref, readonly, onUnmounted, type Ref } from "vue";
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

  // Fungsi pelepas listener SW (diisi oleh startListening).
  let unlisten: (() => void) | null = null;

  // Dengarkan permintaan rules dari SW
  function startListening(): void {
    unlisten = listenForRuleRequest(() => registry.getAll());
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
   * Hitung jumlah entry yang tersimpan di cache.
   * Cache API tidak menyediakan ukuran byte secara langsung, sehingga
   * yang dikembalikan adalah jumlah entry (bukan byte).
   */
  async function count(): Promise<number> {
    const keys = await manager.keys();
    return keys.length;
  }

  // Mulai listener untuk SW cold-start request
  startListening();

  // Lepas listener SW saat komponen di-unmount (hanya berlaku di dalam setup()).
  onUnmounted(() => {
    if (unlisten) {
      unlisten();
      unlisten = null;
    }
  });

  return {
    rules: readonly(rules) as Readonly<Ref<CacheRule[]>>,
    addRule,
    removeRule,
    clearAll,
    clear,
    count,
  };
}

export type { CacheRule, CacheStrategy, UseCacheConfigReturn };
