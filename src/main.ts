import * as core from '@actions/core'
import { act } from './action'
import { validateResource } from './validateResource'
import { processThreshold } from './processThreshold'
import { fetchRateLimit } from './limitFetcher'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    // Get and process the threshold input
    const thresholdAsString: string = core.getInput('threshold') || '10%'
    const { thresholdAsAbsolute, thresholdAsFraction } =
      processThreshold(thresholdAsString)

    // Get the action input
    const actionToTake: string = core.getInput('actionToTake') || 'sweep'

    //Get and validate the alarm and delay inputs
    const alarm: number = parseInt(core.getInput('alarm')) || -1
    const delay: number = parseInt(core.getInput('delay')) || -1

    if (alarm <= 0 && actionToTake === 'sleep') {
      throw new Error('Alarm must be a positive number')
    }
    if (delay < 0 && actionToTake === 'sleep') {
      throw new Error('Delay must be a positive number')
    }

    // Get and validate resource input
    const resource: string = core.getInput('resource') || 'core'
    validateResource(resource)

    // Get the token input
    const token: string =
      core.getInput('token') || String(process.env.GITHUB_TOKEN)

    // Fetch the remaining requests, the limit as well as time of the next reset.
    const { limit, remaining, reset } = await fetchRateLimit(token, resource)

    // set the cutoff, either from the absolute or relative threshold
    const cutoff: number =
      thresholdAsAbsolute ||
      (thresholdAsFraction !== undefined
        ? Math.ceil(thresholdAsFraction * limit)
        : 50)

    // corroborate that enough requests remain, otherwise act
    if (remaining > cutoff) {
      core.info(
        `The API quota is plentiful: ${remaining} of ${limit} requests on ${resource} remain.`
      )
    } else {
      core.info(
        `The API quota is below the threshold: ${remaining} of ${limit} requests on ${resource} remain.`
      )
      await act(actionToTake, limit, reset, alarm, delay, resource)
    }
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
