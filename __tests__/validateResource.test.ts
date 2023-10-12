/**
 * Unit tests for src/validateResource.ts
 */

import * as core from '@actions/core'
import { validateResource } from '../src/validateResource'
import { expect } from '@jest/globals'

// Mock the setFailed function from '@actions/core'
jest.mock('@actions/core', () => ({
  setFailed: jest.fn(),
}));

describe('validateResource.ts', () => {
  it('Accepts core as valid input', async () => {
    validateResource('core');
    expect(core.setFailed).not.toHaveBeenCalled();
  })

  it('Accepts graphql as valid input', async () => {
    validateResource('graphql');
    expect(core.setFailed).not.toHaveBeenCalled();
  })

  it('Accepts search as valid input', async () => {
    validateResource('search');
    expect(core.setFailed).not.toHaveBeenCalled();
  })

  it('Accepts integration_manifest as valid input', async () => {
    validateResource('integration_manifest');
    expect(core.setFailed).not.toHaveBeenCalled();
  })

  it('Accepts code_scanning_upload as valid input', async () => {
    validateResource('code_scanning_upload');
    expect(core.setFailed).not.toHaveBeenCalled();
  })

  it('Fails the step for an invalid resource', () => {
    validateResource('invalid_resource');
    expect(core.setFailed).toHaveBeenCalledWith(
      'The resource must be either core, graphql, search, integration_manifest, or code_scanning_upload.'
    );
  });
})
