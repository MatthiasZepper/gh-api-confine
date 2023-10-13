/**
 * Unit tests for src/processThreshold.ts
 */

import { processThreshold } from '../src/processThreshold';
import { expect } from '@jest/globals'


describe('processThreshold.ts', () => {
  it('should process an absolute threshold correctly', () => {
    const thresholdAsString = '26';
    const result = processThreshold(thresholdAsString);
    
    expect(result.thresholdAsAbsolute).toBe(26);
    expect(result.thresholdAsFraction).toBeUndefined();
  });

  it('should process a fractional threshold correctly', () => {
    const thresholdAsString = '0.3';
    const result = processThreshold(thresholdAsString);
    
    expect(result.thresholdAsAbsolute).toBeUndefined();
    expect(result.thresholdAsFraction).toBe(0.3);
  });

  it('should process a percent threshold correctly', () => {
    const thresholdAsString = '60%';
    const result = processThreshold(thresholdAsString);
    
    expect(result.thresholdAsAbsolute).toBeUndefined();
    expect(result.thresholdAsFraction).toBe(0.6);
  });

  it('should set an error for an invalid threshold (negative number)', () => {
    const thresholdAsString = '-0.1';
    
    expect(() => {
      processThreshold(thresholdAsString);
    }).toThrow( 'The threshold must be a positive number, but -0.1 was provided.');
    
  });

  it('should set an error for an invalid threshold (negative percent)', () => {
    const thresholdAsString = '-30%';

    expect(() => {
      processThreshold(thresholdAsString);
    }).toThrow( 'The threshold must be a positive number, but -30% was provided.');
  });

  it('should handle invalid input (not a number)', () => {
    const thresholdAsString = 'invalid';

    expect(() => {
      processThreshold(thresholdAsString);
    }).toThrow( 'The threshold must be a positive number, but invalid was provided.');
    
  });

  it('should ignore a blank between number and percent sign', () => {
    const thresholdAsString = '50 %';
    const result = processThreshold(thresholdAsString);

    expect(result.thresholdAsAbsolute).toBeUndefined();
    expect(result.thresholdAsFraction).toBe(0.5);
  });
})
