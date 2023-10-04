/**
 * Unit tests for src/sleep.ts
 */

import { sleep } from '../src/sleep'
import { expect } from '@jest/globals'

describe('sleep.ts', () => {
  it('throws an invalid number', async () => {
    const input = parseInt('foo', 10)
    expect(isNaN(input)).toBe(true)

    await expect(sleep(input)).rejects.toThrow('milliseconds not a number')
  })

  it('waits with a valid number', async () => {
    const start = new Date()
    await sleep(500)
    const end = new Date()

    const delta = Math.abs(end.getTime() - start.getTime())

    expect(delta).toBeGreaterThan(450)
  })
})
