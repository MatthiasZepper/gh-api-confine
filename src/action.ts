import * as core from '@actions/core'
import { sleep } from './sleep'

export async function act(
  actionToTake: string,
  limit: number,
  reset: number,
  alarm: number,
  delay: number,
  resource: string
): Promise<void> {
  switch (actionToTake) {
    case 'sleep': {
      // calculate the number of seconds until the rate limit resets
      // (getTime() returns milliseconds, the API UTC epoch seconds)
      const seconds_to_reset = reset - Math.round(new Date().getTime() / 1000)
      const minutes_to_reset = Math.floor(seconds_to_reset / 60)
      const minutes_alarm = Math.floor(alarm / 60)

      core.info(
        `The API quota will reset in ${minutes_to_reset} minutes and ${
          seconds_to_reset % 60
        } seconds.`
      )

      if (seconds_to_reset < alarm) {
        // sleep n milliseconds + delay past the reset time to ensure the limit has been reset
        await sleep((seconds_to_reset + delay) * 1000)
        core.info(
          `The API quota has been reset to ${limit} requests. Farewell!`
        )
      } else {
        core.setFailed(
          `Your alarm set to ${minutes_alarm} minutes and ${
            alarm % 60
          } seconds went off: Sleep is overrated.`
        )
      }
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
