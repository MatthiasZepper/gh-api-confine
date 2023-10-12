/**
 * Unit tests for src/action.ts
 */

import * as core from '@actions/core'
import { act } from '../src/action'
import { expect } from '@jest/globals'

// Mock the setFailed function from '@actions/core'
jest.mock('@actions/core', () => ({
  setFailed: jest.fn(),
}));

describe('action.ts', () => {

  it('should sleep for the specified time and log messages', async () => {
    const actionToTake = 'sleep';
    const limit = 5000;
    const resource = 'core';

    const start = new Date()  // reset is generated from start here, but would be from API response
    await act(actionToTake, limit, Math.round(start.getTime() / 1000) + 15, resource);
    const end = new Date()

    // Assert that sleep has been called with the expected time
    expect(core.info).toHaveBeenCalledWith(
      'The API quota will reset in 0 minutes and 15 seconds.'
    );
    expect(core.info).toHaveBeenCalledWith('The API quota has been reset to 5000 requests. Farewell!');
    expect(require('./sleep').sleep).toHaveBeenCalledWith(15000 + 5000); // 


    const delta = Math.abs(end.getTime() - start.getTime())
    expect(delta).toBeGreaterThan(19500) // 19500 msec: 15s in the future plus 5s offset hardcoded in act
  });

  it('should do nothing for the "peep" action', async () => {
    const actionToTake = 'peep';
    const limit = 5000;
    const reset = Math.round(new Date().getTime() / 1000) + 15;
    const resource = 'core';

    // Ensure it doesn't set any core functions
    const start = new Date() 
    act(actionToTake, limit, reset, resource);
    const end = new Date()
    expect(core.info).not.toHaveBeenCalled();
    expect(core.setFailed).not.toHaveBeenCalled();

    const delta = Math.abs(end.getTime() - start.getTime())
    expect(delta).toBeLessThan(500)
  });

  it('should set a failed message for an unknown action', async () => {
    const actionToTake = 'unknownAction';
    const limit = 5000;
    const reset = Math.round(new Date().getTime() / 1000) + 15;
    const resource = 'core';

    act(actionToTake, limit, reset, resource);

    expect(core.info).not.toHaveBeenCalled();
    expect(core.setFailed).toHaveBeenCalledWith('Workflow run was cancelled because of a low core API quota.');
  });
})