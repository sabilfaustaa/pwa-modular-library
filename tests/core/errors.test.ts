import { describe, it, expect } from 'vitest'
import { PWAError, ConfigValidationError, InitializationError } from '../../src/core/errors'

describe('Error classes', () => {
  it('ConfigValidationError should be instance of PWAError and Error', () => {
    const err = new ConfigValidationError('invalid config')

    expect(err).toBeInstanceOf(ConfigValidationError)
    expect(err).toBeInstanceOf(PWAError)
    expect(err).toBeInstanceOf(Error)
    expect(err.code).toBe('CONFIG_VALIDATION_ERROR')
  })

  it('InitializationError should be instance of PWAError and Error', () => {
    const err = new InitializationError('not initialized')

    expect(err).toBeInstanceOf(InitializationError)
    expect(err).toBeInstanceOf(PWAError)
    expect(err).toBeInstanceOf(Error)
    expect(err.code).toBe('INITIALIZATION_ERROR')
  })
})