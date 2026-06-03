/** Public types untuk useCacheConfig composable. */

import type { Ref } from "vue";

export type CacheStrategy = "cache-first" | "network-first" | "stale-while-revalidate" | "network-only" | "cache-only";

export interface CacheRule {
  /** Pattern URL (string atau RegExp) */
  pattern: string | RegExp;
  /** Strategi caching */
  strategy: CacheStrategy;
  /** Nama cache (default: auto-generated) */
  cacheName?: string;
  /** TTL dalam detik (default: tidak expire) */
  maxAge?: number;
  /** Jumlah maksimum entri cache (default: tidak terbatas) */
  maxEntries?: number;
}

export interface UseCacheConfigReturn {
  /** Daftar aturan caching aktif */
  rules: Readonly<Ref<CacheRule[]>>;
  /** Tambah/update aturan */
  addRule: (rule: CacheRule) => void;
  /** Hapus aturan */
  removeRule: (pattern: string | RegExp) => void;
  /** Bersihkan semua cache */
  clearAll: () => Promise<void>;
  /** Bersihkan cache spesifik */
  clear: (cacheName: string) => Promise<boolean>;
  /** Jumlah entry yang tersimpan di cache (bukan byte — Cache API tak menyediakan ukuran byte). */
  count: () => Promise<number>;
}
