/**
 * Unit tests for src/processThreshold.ts
 */

import * as core from '@actions/core'
import { fetchRateLimit } from '../src/limitFetcher'
import { expect } from '@jest/globals'

// Mock the setFailed function from '@actions/core'
jest.mock('@actions/core', () => ({
  debug: jest.fn(),
  exportVariable: jest.fn(),
  setFailed: jest.fn(),
  setOutput: jest.fn()
}))

jest.mock('@actions/github', () => ({
  getOctokit: jest.fn()
}))

// Mock the rateLimit.get function from '@actions/github'

jest.mock('@actions/github', () => {
  const originalModule = jest.requireActual('@actions/github')
  return {
    ...originalModule,
    getOctokit: (token: string) => {
      const octoKitInstance = originalModule.getOctokit(token)
      octoKitInstance.rest.rateLimit.get = async () => {
        // Return a Promise with the expected data structure
        return Promise.resolve({
          data: {
            resources: {
              core: {
                limit: 5000,
                remaining: 4300,
                reset: 1696896000,
                used: 700
              },
              search: {
                limit: 30,
                remaining: 18,
                reset: 1696896400,
                used: 12
              }
            }
          }
        })
      }
      return octoKitInstance
    }
  }
})

describe('limitFetcher.ts', () => {
  it('should fetch and return the core rate limit', async () => {
    const token = 'some_fake_github_token'
    const resource = 'core'

    const result = await fetchRateLimit(token, resource)

    expect(core.setFailed).not.toHaveBeenCalled()
    expect(result.limit).toBe(5000)
    expect(result.remaining).toBe(4300)
    expect(result.reset).toBe(1696896000)

    expect(core.debug).toHaveBeenCalled()
    expect(core.setOutput).toHaveBeenCalledWith('remaining_abs', 4300)
    expect(core.setOutput).toHaveBeenCalledWith('remaining_rel', 0.86)
  })

  it('should fetch and return the search rate limit', async () => {
    const token = 'some_fake_github_token'
    const resource = 'search'

    const result = await fetchRateLimit(token, resource)

    expect(core.setFailed).not.toHaveBeenCalled()
    expect(result.limit).toBe(30)
    expect(result.remaining).toBe(18)
    expect(result.reset).toBe(1696896400)
  })

  it('should set a failed message on API error', async () => {
    const token = 'some_fake_github_token'
    const resource = 'tux_awesomeness' // this resource has no limits

    await fetchRateLimit(token, resource)

    expect(core.setFailed).toHaveBeenCalledWith(
      'Github API rateLimit could not be retrieved.'
    )
  })
})
