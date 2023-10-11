import * as core from '@actions/core'

export function processThreshold(thresholdAsString: string): {
  thresholdAsAbsolute: number | undefined
  thresholdAsFraction: number | undefined
} {
  let thresholdAsAbsolute = undefined
  let thresholdAsFraction = undefined

  if (thresholdAsString.endsWith('%')) {
    thresholdAsFraction = parseFloat(thresholdAsString.slice(0, -1)) / 100
    if (thresholdAsFraction <= 0) {
      core.setFailed(
        `The threshold must be a positive number, but ${thresholdAsString} was provided.`
      )
    }
  } else {
    const threshold: number = parseFloat(thresholdAsString) || 0.1
    if (threshold <= 0) {
      core.setFailed(
        `The threshold must be a positive number, but ${thresholdAsString} was provided.`
      )
    }
    // if threshold is smaller than 1, interpret it as a fraction
    if (threshold < 1) {
      thresholdAsFraction = threshold
    } else {
      thresholdAsAbsolute = threshold
    }
  }
  return { thresholdAsAbsolute, thresholdAsFraction }
}
