/**
 * retry-policy — Strategi backoff untuk retry sync.
 *
 * Mendukung:
 *   - exponential: delay = baseMs × 2^retryCount
 *   - linear: delay = baseMs × (retryCount + 1)
 *
 * @module modules/push-sync/retry-policy
 * @internal
 */

export const DEFAULT_BASE_DELAY_MS = 1000;
export const DEFAULT_MAX_DELAY_MS = 300_000; // 5 menit

export interface RetryPolicy {
  /** Nama strategi */
  name: "linear" | "exponential";
  /** Delay dasar (ms) sebelum backoff. Default: 1000 */
  baseDelayMs: number;
  /** Delay maksimum (ms). Default: 300000 (5 menit) */
  maxDelayMs: number;
}

/**
 * Hitung delay untuk retry berikutnya berdasarkan retryCount (0-indexed).
 * retryCount = 1 → retry kedua, dst.
 */
export function computeDelay(retryCount: number, policy?: Partial<RetryPolicy>): number {
  const strategy = policy?.name ?? "exponential";
  const base = policy?.baseDelayMs ?? DEFAULT_BASE_DELAY_MS;
  const max = policy?.maxDelayMs ?? DEFAULT_MAX_DELAY_MS;

  let delay: number;

  if (strategy === "linear") {
    delay = base * (retryCount + 1);
  } else {
    delay = base * Math.pow(2, retryCount);
  }

  return Math.min(delay, max);
}

/**
 * Tunggu selama delayMs millisecond.
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
