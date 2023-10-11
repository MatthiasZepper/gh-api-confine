import * as core from '@actions/core'
import * as github from '@actions/github'
import { sleep } from './sleep'

interface Resource {
  limit: number
  remaining: number
  reset: number
  used: number
}

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const thresholdAsString: string = core.getInput('threshold') || '10%'
    const actionToTake: string = core.getInput('actionToTake') || 'sweep'
    const resource: string = core.getInput('resource') || 'core'
    const token: string =
      core.getInput('token') || String(process.env.GITHUB_TOKEN)

    // corroborate that resource is one of the valid resource types / quotas:
    if (
      ![
        'core',
        'search',
        'graphql',
        'integration_manifest',
        'code_scanning_upload'
      ].includes(resource)
    ) {
      core.setFailed(
        `The resource must be either core, graphql, search, integration_manifest, or code_scanning_upload.`
      )
    }

    let thresholdAsAbsolute = undefined;
    let thresholdAsFraction = undefined;

    if (thresholdAsString.endsWith('%')) {
      thresholdAsFraction = parseFloat(
        thresholdAsString.slice(0, -1)
      ) / 100
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


    if (!token) {
      core.setFailed('Please provide a Github token')
    }

    // retrieve the number of remaining API requests
    const octoKit = github.getOctokit(token)
    const rateLimit = await octoKit.rest.rateLimit.get()
    core.debug(JSON.stringify(rateLimit))

    // retrieve the property of the rateLimit object that corresponds to the resource
    const resourceData: Resource = rateLimit.data.resources[
      resource as keyof typeof rateLimit.data.resources
    ] as Resource
    const limit: number = resourceData.limit || 1
    const remaining: number = resourceData.remaining || -1
    const reset: number = resourceData.reset || -1
    // set the cutoff, either from the absolute or relative limit.
    const cutoff: number = thresholdAsAbsolute || (thresholdAsFraction !== undefined ? Math.ceil(thresholdAsFraction * limit) : 50)


    if (remaining < 0 || reset < 0) {
      core.setFailed('Github API rateLimit could not be retrieved.')
    } else {
      core.exportVariable('GITHUB_REMAINING_API_QUOTA', remaining)
      core.setOutput('remaining', remaining)

      if (remaining > cutoff) {
        core.info(
          `The API limit is plentiful: ${remaining} of ${limit} requests on ${resource} remain.`
        )
      } else {
        core.info(
          `The API limit is too low: ${remaining} of ${limit} requests on ${resource} remain.`
        )

        switch (actionToTake) {
          case 'sleep': {
            // calculate the number of seconds until the rate limit resets (getTime() returns milliseconds, the API UTC epoch seconds)
            const seconds_to_reset =
              reset - Math.round(new Date().getTime() / 1000)
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

          }
          default:
            core.setFailed(
              `Workflow run was cancelled because of a low ${resource} API quota.`
            )
        }
      }
    }
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
