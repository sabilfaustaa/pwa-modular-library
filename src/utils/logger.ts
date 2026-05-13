/**
 * logger — Logger internal dengan flag debug.
 *
 * @module utils/logger
 */

const DEBUG = typeof process !== "undefined" && process.env?.DEBUG === "true";

export const logger = {
  info(message: string, ...args: unknown[]): void {
    if (DEBUG) console.info(`[pwa-library] ${message}`, ...args);
  },

  warn(message: string, ...args: unknown[]): void {
    if (DEBUG) console.warn(`[pwa-library] ${message}`, ...args);
  },

  error(message: string, ...args: unknown[]): void {
    console.error(`[pwa-library] ${message}`, ...args);
  },
};
