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
    let lowerBound: number = parseInt(core.getInput('lowerBound')) || 50
    let actionToTake: string = core.getInput('actionToTake') || 'sweep'
    let resource: string = core.getInput('resource') || 'core'
    let token: string =
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
    const remaining: number = resourceData.remaining || -1
    const reset: number = resourceData.reset || -1

    if (remaining < 0 || reset < 0) {
      core.setFailed('Github API rateLimit could not be retrieved.')
    } else {
      core.exportVariable('remaining', remaining)
      core.setOutput('remaining', remaining)

      if (remaining > lowerBound) {
        core.info(
          `The API limit is plentiful: ${remaining} requests on ${resource} remain.`
        )
      } else {
        core.info(
          `The API limit is dangerously low: ${remaining} requests on ${resource} remain.`
        )

        switch (actionToTake) {
          case 'sleep':
            // calculate the number of seconds until the rate limit resets (getTime() returns milliseconds, the API UTC epoch seconds)
            const seconds_to_reset =
              reset - Math.round(new Date().getTime() / 1000)
            const minutes = Math.floor(seconds_to_reset / 60)

            core.info(
              `The API limit will reset in ${minutes} minutes and ${
                seconds_to_reset % 60
              } seconds.`
            )

            // sleep n milliseconds + 5 seconds past the reset time to ensure the limit has been reset
            await sleep(seconds_to_reset * 1000 + 5000)

            core.info(`The API limit has been reset. Farewell!`)
            break
          default:
            core.setFailed(
              `The API limit of ${resource} was too low to proceed.`
            )
        }
      }
    }
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
