/**
 * Unit tests for src/validateResource.ts
 */
import { validateResource } from '../src/validateResource'
import { expect } from '@jest/globals'

// Mock the setFailed function from '@actions/core'
jest.mock('@actions/core', () => ({
  setFailed: jest.fn(),
}));

describe('validateResource.ts', () => {
  it('accepts core as valid input', async () => {
    expect(() => {validateResource('core');}).not.toThrow();
  })

  it('accepts graphql as valid input', async () => {
    expect(() => {validateResource('graphql');}).not.toThrow();
  })

  it('accepts search as valid input', async () => {
    expect(() => {validateResource('search');}).not.toThrow();
  })

  it('accepts integration_manifest as valid input', async () => {
    expect(() => {validateResource('integration_manifest');}).not.toThrow();
  })

  it('accepts code_scanning_upload as valid input', async () => {
    expect(() => {validateResource('code_scanning_upload');}).not.toThrow();
  })

  it('fails the step for an invalid resource', () => {
    expect(() => {validateResource('invalid_resource');}).toThrow('The resource must be either core, graphql, search, integration_manifest, or code_scanning_upload.');
  });
})
