import type { PWAConfig } from '../types/config'
import { ConfigValidationError } from './errors'

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function validateConfig(config: unknown): PWAConfig {
  if (config === undefined) return {}

  if (!isPlainObject(config)) {
    throw new ConfigValidationError('Config must be a plain object')
  }

  const cfg = config as PWAConfig

  if (cfg.serviceWorker !== undefined) {
    if (!isPlainObject(cfg.serviceWorker)) {
      throw new ConfigValidationError('serviceWorker must be an object')
    }

    const sw = cfg.serviceWorker

    if (sw.url !== undefined && typeof sw.url !== 'string') {
      throw new ConfigValidationError('serviceWorker.url must be a string')
    }

    if (sw.scope !== undefined && typeof sw.scope !== 'string') {
      throw new ConfigValidationError('serviceWorker.scope must be a string')
    }

    if (
      sw.updateViaCache !== undefined &&
      sw.updateViaCache !== 'all' &&
      sw.updateViaCache !== 'imports' &&
      sw.updateViaCache !== 'none'
    ) {
      throw new ConfigValidationError(
        'serviceWorker.updateViaCache must be one of: all, imports, none'
      )
    }
  }

  if (cfg.cache !== undefined) {
    if (!isPlainObject(cfg.cache)) {
      throw new ConfigValidationError('cache must be an object')
    }

    if (
      cfg.cache.defaultCacheName !== undefined &&
      typeof cfg.cache.defaultCacheName !== 'string'
    ) {
      throw new ConfigValidationError('cache.defaultCacheName must be a string')
    }
  }

  if (cfg.storage !== undefined) {
    if (!isPlainObject(cfg.storage)) {
      throw new ConfigValidationError('storage must be an object')
    }

    if (cfg.storage.dbName !== undefined && typeof cfg.storage.dbName !== 'string') {
      throw new ConfigValidationError('storage.dbName must be a string')
    }

    if (
      cfg.storage.storeName !== undefined &&
      typeof cfg.storage.storeName !== 'string'
    ) {
      throw new ConfigValidationError('storage.storeName must be a string')
    }
  }

  if (cfg.sync !== undefined) {
    if (!isPlainObject(cfg.sync)) {
      throw new ConfigValidationError('sync must be an object')
    }

    if (cfg.sync.maxRetries !== undefined && typeof cfg.sync.maxRetries !== 'number') {
      throw new ConfigValidationError('sync.maxRetries must be a number')
    }

    if (cfg.sync.retryDelay !== undefined && typeof cfg.sync.retryDelay !== 'number') {
      throw new ConfigValidationError('sync.retryDelay must be a number')
    }
  }

  if (cfg.notification !== undefined) {
    if (!isPlainObject(cfg.notification)) {
      throw new ConfigValidationError('notification must be an object')
    }

    if (
      cfg.notification.requestPermissionOnInit !== undefined &&
      typeof cfg.notification.requestPermissionOnInit !== 'boolean'
    ) {
      throw new ConfigValidationError(
        'notification.requestPermissionOnInit must be a boolean'
      )
    }
  }

  return cfg
}