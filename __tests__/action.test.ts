/**
 * Unit tests for src/action.ts
 */

import * as core from '@actions/core'
import { act } from '../src/action'
import * as pause from '../src/sleep'
import { expect } from '@jest/globals'

// Mock the setFailed function from '@actions/core' with empty functions.
jest.mock('@actions/core', () => ({
  setFailed: jest.fn(),
  info: jest.fn()
}))

// spy on sleep, so the actual function is still called.
const sleepMock = jest.spyOn(pause, 'sleep')

describe('action.ts', () => {
  it('should sleep for the specified time and log messages', async () => {
    const actionToTake = 'sleep'
    const limit = 5000
    const alarm = 900
    const delay = 0.1
    const resource = 'core'

    const start = new Date() // reset is generated from start here, but would be from API response
    await act(
      actionToTake,
      limit,
      Math.round(start.getTime() / 1000) + 1,
      alarm,
      delay,
      resource
    )
    const end = new Date()

    // Assert that sleep has been called with the expected time
    expect(core.info).toHaveBeenCalledWith(
      'The API quota will reset in 0 minutes and 1 seconds.'
    )
    expect(core.info).toHaveBeenCalledWith(
      'The API quota has been reset to 5000 requests. Farewell!'
    )
    expect(sleepMock).toHaveBeenCalledWith(1100) //

    const delta = Math.abs(end.getTime() - start.getTime())
    expect(delta).toBeGreaterThan(1050)
  })

  it('should fail the workflow instead sleep, if reset is later than alarm', async () => {
    const actionToTake = 'sleep'
    const limit = 5000
    const alarm = 90
    const delay = 1
    const resource = 'core'

    const start = new Date() // reset is generated from start here, but would be from API response
    await act(
      actionToTake,
      limit,
      Math.round(start.getTime() / 1000) + 1800,
      alarm,
      delay,
      resource
    )
    const end = new Date()

    // Assert that sleep has been called with the expected time
    expect(core.info).toHaveBeenCalledWith(
      'The API quota will reset in 30 minutes and 0 seconds.'
    )

    expect(sleepMock).not.toHaveBeenCalled() //
    const delta = Math.abs(end.getTime() - start.getTime())
    expect(delta).toBeLessThan(1000)
    expect(core.setFailed).toHaveBeenCalledWith(
      'Your alarm set to 1 minutes and 30 seconds went off: Sleep is overrated.'
    )
  })

  it('should do nothing for the "peep" action', async () => {
    const actionToTake = 'peep'
    const limit = 5000
    const reset = Math.round(new Date().getTime() / 1000) + 0.1
    const alarm = 900
    const delay = 0.1
    const resource = 'core'

    // Ensure it doesn't set any core functions
    const start = new Date()
    act(actionToTake, limit, reset, alarm, delay, resource)
    const end = new Date()
    expect(core.info).not.toHaveBeenCalled()
    expect(core.setFailed).not.toHaveBeenCalled()

    const delta = Math.abs(end.getTime() - start.getTime())
    expect(delta).toBeLessThan(100)
  })

  it('should set a failed message for an unknown action', async () => {
    const actionToTake = 'unknownAction'
    const limit = 5000
    const reset = Math.round(new Date().getTime() / 1000) + 0.1
    const alarm = 900
    const delay = 0.1
    const resource = 'core'

    act(actionToTake, limit, reset, alarm, delay, resource)

    expect(core.info).not.toHaveBeenCalled()
    expect(core.setFailed).toHaveBeenCalledWith(
      'Workflow run was cancelled because of a low core API quota.'
    )
  })
})
