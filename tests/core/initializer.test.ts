import { beforeEach, describe, expect, it } from 'vitest'
import { CoreModule } from '../../src/core/initializer'
import { ConfigValidationError, InitializationError } from '../../src/core/errors'

describe('CoreModule', () => {
  beforeEach(() => {
    CoreModule.reset()
  })

  it('should initialize without config', () => {
    const instance = CoreModule.init()

    expect(instance).toBeInstanceOf(CoreModule)
    expect(instance.isInitialized).toBe(true)
    expect(instance.config).toEqual({})
  })

  it('should initialize with valid config', () => {
    const config = {
      cache: {
        defaultCacheName: 'custom-cache'
      }
    }

    const instance = CoreModule.init(config)

    expect(instance.config).toEqual(config)
    expect(instance.isInitialized).toBe(true)
  })

  it('should return the same instance on multiple init calls', () => {
    const instance1 = CoreModule.init()
    const instance2 = CoreModule.init({
      cache: { defaultCacheName: 'ignored-after-first-init' }
    })

    expect(instance1).toBe(instance2)
  })

  it('should throw InitializationError if getInstance is called before init', () => {
    expect(() => CoreModule.getInstance()).toThrow(InitializationError)
  })

  it('should return the same initialized instance via getInstance', () => {
    const instance1 = CoreModule.init()
    const instance2 = CoreModule.getInstance()

    expect(instance1).toBe(instance2)
  })

  it('should propagate ConfigValidationError for invalid config', () => {
    expect(() => CoreModule.init(null)).toThrow(ConfigValidationError)
  })

  it('should expose capabilities as a boolean map', () => {
    const instance = CoreModule.init()

    expect(typeof instance.capabilities.serviceWorker).toBe('boolean')
    expect(typeof instance.capabilities.indexedDB).toBe('boolean')
    expect(typeof instance.capabilities.notifications).toBe('boolean')
    expect(typeof instance.capabilities.cacheAPI).toBe('boolean')
  })
})