import * as core from '@actions/core'

export function processThreshold(thresholdAsString: string): {
  thresholdAsAbsolute: number | undefined
  thresholdAsFraction: number | undefined
} {
  let thresholdAsAbsolute = undefined
  let thresholdAsFraction = undefined
  const valueError = `The threshold must be a positive number, but ${thresholdAsString} was provided.`

  if (thresholdAsString.endsWith('%')) {
    thresholdAsFraction = parseFloat(thresholdAsString.slice(0, -1)) / 100
    if (thresholdAsFraction <= 0) {
      throw new Error(valueError)
    }
  } else {
    const threshold: number = parseFloat(thresholdAsString) || 0

    // if threshold is smaller than 1, interpret it as a fraction
    if (threshold < 1) {
        thresholdAsFraction = threshold
      } else {
        thresholdAsAbsolute = threshold
    }

    if (threshold <= 0) {
      throw new Error(valueError)
    }

  }
  return { thresholdAsAbsolute, thresholdAsFraction }
}
