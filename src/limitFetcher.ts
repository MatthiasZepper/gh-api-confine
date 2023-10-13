import * as core from '@actions/core'
import * as github from '@actions/github'

interface Resource {
  limit: number
  remaining: number
  reset: number
  used: number
}

export async function fetchRateLimit(
  token: string,
  resource: string
): Promise<{ limit: number; remaining: number; reset: number }> {
  // retrieve the number of remaining API requests
  const octoKit = github.getOctokit(token)
  const rateLimit = await octoKit.rest.rateLimit.get()
  core.debug(JSON.stringify(rateLimit))

  // retrieve the property of the rateLimit object that corresponds to the resource
  const resourceData: Resource = rateLimit.data.resources[
    resource as keyof typeof rateLimit.data.resources
  ] as Resource

    // Provide default values for the properties
  const limit: number = resourceData?.limit || -1;
  const remaining: number = resourceData?.remaining || -1;
  const reset: number = resourceData?.reset || -1;

  if (limit < 0 || remaining < 0 || reset < 0) {
    core.setFailed('Github API rateLimit could not be retrieved.')
  } else {
    core.exportVariable('GITHUB_REMAINING_API_QUOTA', remaining)
    core.setOutput('remaining_abs', remaining)
    core.setOutput('remaining_rel', Math.round(remaining / limit * 100) / 100)
  }
    return { limit, remaining, reset }
}
