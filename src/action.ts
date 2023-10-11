import * as core from '@actions/core'
import { sleep } from './sleep'

export async function act(
  actionToTake: string,
  limit: number,
  reset: number,
  resource: string
): Promise<void> {
  switch (actionToTake) {
    case 'sleep': {
      // calculate the number of seconds until the rate limit resets
      // (getTime() returns milliseconds, the API UTC epoch seconds)
      const seconds_to_reset = reset - Math.round(new Date().getTime() / 1000)
      const minutes = Math.floor(seconds_to_reset / 60)

      core.info(
        `The API quota will reset in ${minutes} minutes and ${
          seconds_to_reset % 60
        } seconds.`
      )

      // sleep n milliseconds + 5 seconds past the reset time to ensure the limit has been reset
      await sleep(seconds_to_reset * 1000 + 5000)

      core.info(`The API quota has been reset to ${limit} requests. Farewell!`)
      break
    }
    case 'peep': {
      break
    }
    default:
      core.setFailed(
        `Workflow run was cancelled because of a low ${resource} API quota.`
      )
  }
}
