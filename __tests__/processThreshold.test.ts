/**
 * Unit tests for src/processThreshold.ts
 */

import * as core from '@actions/core'
import { processThreshold } from '../src/processThreshold';
import { expect } from '@jest/globals'

// Mock the setFailed function from '@actions/core'
jest.mock('@actions/core', () => ({
  setFailed: jest.fn(),
}));


describe('processThreshold.ts', () => {
  it('should process an absolute threshold correctly', () => {
    const thresholdAsString = '26';
    const result = processThreshold(thresholdAsString);
    
    expect(core.setFailed).not.toHaveBeenCalled();
    expect(result.thresholdAsAbsolute).toBe(26);
    expect(result.thresholdAsFraction).toBeUndefined();
  });

  it('should process a fractional threshold correctly', () => {
    const thresholdAsString = '0.3';
    const result = processThreshold(thresholdAsString);
    
    expect(core.setFailed).not.toHaveBeenCalled();
    expect(result.thresholdAsAbsolute).toBeUndefined();
    expect(result.thresholdAsFraction).toBe(0.3);
  });

  it('should process a percent threshold correctly', () => {
    const thresholdAsString = '60%';
    const result = processThreshold(thresholdAsString);
    
    expect(core.setFailed).not.toHaveBeenCalled();
    expect(result.thresholdAsAbsolute).toBeUndefined();
    expect(result.thresholdAsFraction).toBe(0.6);
  });

  it('should set an error for an invalid threshold (negative number)', () => {
    const thresholdAsString = '-0.1';
    const result = processThreshold(thresholdAsString);
    
    expect(core.setFailed).toHaveBeenCalledWith(
      'The threshold must be a positive number, but -0.1 was provided.'
    );
    expect(result.thresholdAsAbsolute).toBeUndefined();
    expect(result.thresholdAsFraction).toBeUndefined();
  });

  it('should handle invalid input (not a number)', () => {
    const thresholdAsString = 'invalid';
    const result = processThreshold(thresholdAsString);
    
    expect(core.setFailed).toHaveBeenCalledWith(
      'The threshold must be a positive number, but invalid was provided.'
    );
    expect(result.thresholdAsAbsolute).toBeUndefined();
    expect(result.thresholdAsFraction).toBeUndefined();
  });

  it('should ignore a blank between number and percent sign', () => {
    const thresholdAsString = '50 %';
    const result = processThreshold(thresholdAsString);
    
    expect(core.setFailed).not.toHaveBeenCalled();
    expect(result.thresholdAsAbsolute).toBeUndefined();
    expect(result.thresholdAsFraction).toBe(50);
  });
})
