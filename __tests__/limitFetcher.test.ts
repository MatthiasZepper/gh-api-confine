/**
 * Unit tests for src/processThreshold.ts
 */

import * as core from '@actions/core'
import nock from 'nock'; // Import the nock library for mocking HTTP requests
import { fetchRateLimit } from '../src/limitFetcher';
import { expect } from '@jest/globals'

// Mock the setFailed function from '@actions/core'
jest.mock('@actions/core', () => ({
  setFailed: jest.fn(),
}));

describe('limitFetcher.ts', () => {
  beforeAll(() => {
    // Set up a mock for the GitHub API
    nock('https://api.github.com')
      .get('/rate_limit')
      .reply(200, {
        data: {
          resources: {
            core: {
              limit: 5000,
              remaining: 4300,
              reset: 1696896000,
              used: 700,
            },        
            search: {
              limit: 30,
              remaining: 18,
              reset: 1696896400,
              used: 12,
            },
          },
        },
      });
  });

  afterAll(() => {
    // Clean up the nock mocks
    nock.cleanAll();
  });

  it('should fetch and return the core rate limit', async () => {
    const token = 'some_fake_github_token';
    const resource = 'core';

    const result = await fetchRateLimit(token, resource);

    expect(core.setFailed).not.toHaveBeenCalled();
    expect(result.limit).toBe(5000);
    expect(result.remaining).toBe(4300);
    expect(result.reset).toBe(1696896000);
  });

  it('should fetch and return the search rate limit', async () => {
    const token = 'some_fake_github_token';
    const resource = 'search';

    const result = await fetchRateLimit(token, resource);

    expect(core.setFailed).not.toHaveBeenCalled();
    expect(result.limit).toBe(30);
    expect(result.remaining).toBe(18);
    expect(result.reset).toBe(1696896400);
  });

  it('should set a failed message on API error', async () => {
    // Mock the GitHub API to return an error (e.g., 404 Not Found)
    nock('https://api.github.com')
      .get('/rate_limit')
      .reply(404);

    const token = 'some_fake_github_token';
    const resource = 'core';

    await fetchRateLimit(token, resource);

    expect(core.setFailed).toHaveBeenCalledWith('Github API rateLimit could not be retrieved.');
  });

});

