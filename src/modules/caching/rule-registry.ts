/**
 * RuleRegistry — Manajemen aturan caching berbasis pattern.
 *
 * Rules disimpan in-memory (D5). Setiap perubahan di-broadcast ke
 * service worker via postMessage.
 *
 * @module modules/caching/rule-registry
 */

import type { CacheRule } from "../../types/cache.types";

export class RuleRegistry {
  private rules: CacheRule[] = [];

  constructor(initialRules?: CacheRule[]) {
    if (initialRules) {
      this.rules = [...initialRules];
    }
  }

  /**
   * Tambah aturan caching. Jika pattern sudah ada, replace.
   */
  addRule(rule: CacheRule): void {
    const existingIndex = this.rules.findIndex((r) => String(r.pattern) === String(rule.pattern));
    if (existingIndex !== -1) {
      this.rules[existingIndex] = rule;
    } else {
      this.rules.push(rule);
    }
  }

  /**
   * Hapus aturan berdasarkan pattern.
   */
  removeRule(pattern: string | RegExp): boolean {
    const patternStr = String(pattern);
    const index = this.rules.findIndex((r) => String(r.pattern) === patternStr);
    if (index !== -1) {
      this.rules.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Cari aturan yang cocok dengan URL.
   * Mengembalikan rule pertama yang match (first-match wins).
   */
  findMatch(url: string): CacheRule | null {
    for (const rule of this.rules) {
      if (this.matchPattern(url, rule.pattern)) {
        return rule;
      }
    }
    return null;
  }

  /**
   * Cocokkan URL terhadap pattern (string atau RegExp).
   */
  private matchPattern(url: string, pattern: string | RegExp): boolean {
    if (typeof pattern === "string") {
      // Exact match atau glob sederhana (* wildcard)
      return this.matchGlob(url, pattern);
    }

    if (pattern instanceof RegExp) {
      return pattern.test(url);
    }

    return false;
  }

  /**
   * Glob matching sederhana: * cocok dengan nol atau lebih karakter.
   * Contoh: pola "star/api/star" cocok dengan "/api/users" dan "https://host/api/data".
   */
  private matchGlob(url: string, pattern: string): boolean {
    // Escape special regex chars kecuali *
    const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&");
    // Ganti * dengan regex wildcard
    const regexStr = escaped.replace(/\*/g, ".*");
    const regex = new RegExp(`^${regexStr}$`);
    return regex.test(url);
  }

  /**
   * Dapatkan salinan semua aturan (readonly).
   */
  getAll(): readonly CacheRule[] {
    return [...this.rules];
  }

  /**
   * Hapus semua aturan.
   */
  clearAll(): void {
    this.rules = [];
  }

  /**
   * Jumlah aturan yang terdaftar.
   */
  get size(): number {
    return this.rules.length;
  }
}
