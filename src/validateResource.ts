import * as core from '@actions/core'

export function validateResource(resource: string): void {
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
}
