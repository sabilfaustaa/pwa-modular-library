import { describe, expect, it } from 'vitest'
import { validateConfig } from '../../src/core/validator'
import { ConfigValidationError } from '../../src/core/errors'

describe('validateConfig', () => {
  it('should return empty object if config is undefined', () => {
    expect(validateConfig(undefined)).toEqual({})
  })

  it('should return empty object if config is empty object', () => {
    expect(validateConfig({})).toEqual({})
  })

  it('should throw if config is null', () => {
    expect(() => validateConfig(null)).toThrow(ConfigValidationError)
  })

  it('should throw if config is not a plain object', () => {
    expect(() => validateConfig('string')).toThrow(ConfigValidationError)
    expect(() => validateConfig(42)).toThrow(ConfigValidationError)
    expect(() => validateConfig(true)).toThrow(ConfigValidationError)
    expect(() => validateConfig([])).toThrow(ConfigValidationError)
  })

  it('should return valid config unchanged', () => {
    const config = {
      serviceWorker: {
        url: '/sw.js',
        scope: '/',
        updateViaCache: 'all' as const
      },
      cache: {
        defaultCacheName: 'my-cache'
      },
      storage: {
        dbName: 'my-db',
        storeName: 'my-store'
      },
      sync: {
        maxRetries: 5,
        retryDelay: 2000
      },
      notification: {
        requestPermissionOnInit: true
      }
    }

    expect(validateConfig(config)).toEqual(config)
  })

  it('should throw if a nested field type is invalid', () => {
    expect(() =>
      validateConfig({
        sync: {
          maxRetries: 'three'
        }
      })
    ).toThrow(ConfigValidationError)
  })

  it('should throw if updateViaCache is invalid', () => {
    expect(() =>
      validateConfig({
        serviceWorker: {
          updateViaCache: 'invalid'
        }
      })
    ).toThrow(ConfigValidationError)
  })
})