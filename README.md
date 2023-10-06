# GH API Confine

[![GitHub Super-Linter](https://github.com/actions/typescript-action/actions/workflows/linter.yml/badge.svg)](https://github.com/super-linter/super-linter)
![CI](https://github.com/actions/typescript-action/actions/workflows/ci.yml/badge.svg)

**GH API Confine** (GitHub API Quota Limiter) is a humble Github action step designed to help you use the GitHub API more effectively.

With **GH API Confine**, you can easily monitor your remaining GitHub API quota and act accordingly. Specify a threshold and either delay or terminate your workflow, if your quota falls below this limit.
## Features

- **Quota monitoring:** The step keeps track of your GitHub API quota, helping you stay within your allocated limits.

- **Customizable action:** Define how **GH API Confine** should respond when your API quota falls below a specified threshold. Choose between three modes:
  - **Peep (Observe):** Take no further action beyond checking the quota.
  - **Sleep (Wait):** Delay the completion of the step until shortly after your API quota renews, maximizing the chances of successful job completion.
  - **Sweep (Terminate):** Immediately terminate the workflow run to prevent further API usage if your quota is too low.

### Inputs

| Input         | Description                                  | Required| Default |
|---------------|----------------------------------------------|---------|---------|
| `actionToTake`         | Select between 'peep', 'sleep' and 'sweep'.                       | No     | sweep   |
| `threshold`     | Context string to filter the statuses API    | No     |   50      |
| `resource`| Monitored Github API resource: One of 'core', 'search', 'graphql', 'integration_manifest' or 'code_scanning_upload'    | No      | core     |
| `token`       | Github API token to use for the action. Defaults to your current one.   | No      | ${{github.token}}     |


### Outputs

| Output | Description |
|--------|-------------|
| result | Failure or success result of the status |

## Usage

The most simple way to use this action step is within a separate job that precedes the main job. Since the `api_quota_check` job will fail, if your API quota is too low, `some_other_job` will not not even start.

If you set `actionToTake` to _sleep_ instead, the `api_quota_check` will delay it's completion until shortly after the allotted quota renews. This does not guarantee the successful completion of your job (in particular if multiple workflows are running in parallel), but maximizes the chances. Stop wasting your precious API requests on attempting workflow runs that certainly will not succeed.

```yaml
jobs:
  api_quota_check:
    runs-on: ubuntu-latest

    steps:
      - uses: MatthiasZepper/sweep_or_sleep_action
        id: check_quota
        with:
          lowerBound: 20
          actionToTake: "sweep"

  some_other_job:
    needs: api_quota_check
```

Since

```yaml
jobs:
  api_quota_check:
    runs-on: ubuntu-latest
    outputs:
      remaining: ${{ steps.check_quota.outputs.remaining }}

    steps:
      - uses: MatthiasZepper/sweep_or_sleep_action
        id: check_quota
        with:
          lowerBound: 990
          actionToTake: "sweep"

      - name: Print quota
        run: echo "Remaining API requests ${{steps.check_quota.outputs.remaining}}"

  some_other_job:
    needs: api_quota_check
```

## Development

### Initial Setup

After you've cloned the repository to your local machine or codespace, you'll
need to perform some initial setup steps:

> [!NOTE]
>
> You'll need to have a reasonably modern version of
> [Node.js](https://nodejs.org) handy. If you are using a version manager like
> [`nodenv`](https://github.com/nodenv/nodenv) or
> [`nvm`](https://github.com/nvm-sh/nvm), you can run `nodenv install` in the
> root of your repository to install the version specified in
> [`package.json`](./package.json). Otherwise, 20.x or later should work!

1. :hammer_and_wrench: Install the dependencies

   ```bash
   npm install
   ```

1. :building_construction: Package the TypeScript for distribution

   ```bash
   npm run bundle
   ```

1. :white_check_mark: Run the tests

   ```bash
   $ npm test

   PASS  ./index.test.js
     ✓ throws invalid number (3ms)
     ✓ wait 500 ms (504ms)
     ✓ test runs (95ms)

   ...
   ```

## Update the Action Code

The [`src/`](./src/) directory is the heart of the action! This contains the
source code that will be run when your action is invoked. You can replace the
contents of this directory with your own code.

There are a few things to keep in mind when writing your action code:

- Most GitHub Actions toolkit and CI/CD operations are processed asynchronously.
  In `main.ts`, you will see that the action is run in an `async` function.

  ```javascript
  import * as core from '@actions/core'
  //...

  async function run() {
    try {
      //...
    } catch (error) {
      core.setFailed(error.message)
    }
  }
  ```

  For more information about the GitHub Actions toolkit, see the
  [documentation](https://github.com/actions/toolkit/blob/master/README.md).

So, what are you waiting for? Go ahead and start customizing your action!

1. Create a new branch

   ```bash
   git checkout -b releases/v1
   ```

1. Replace the contents of `src/` with your action code
1. Add tests to `__tests__/` for your source code
1. Format, test, and build the action

   ```bash
   npm run all
   ```

   > [!WARNING]
   >
   > This step is important! It will run [`ncc`](https://github.com/vercel/ncc)
   > to build the final JavaScript action code with all dependencies included.
   > If you do not run this step, your action will not work correctly when it is
   > used in a workflow. This step also includes the `--license` option for
   > `ncc`, which will create a license file for all of the production node
   > modules used in your project.

1. Commit your changes

   ```bash
   git add .
   git commit -m "My first action is ready!"
   ```

1. Push them to your repository

   ```bash
   git push -u origin releases/v1
   ```

1. Create a pull request and get feedback on your action
1. Merge the pull request into the `main` branch

Your action is now published! :rocket:

For information about versioning your action, see
[Versioning](https://github.com/actions/toolkit/blob/master/docs/action-versioning.md)
in the GitHub Actions toolkit.

## Validate the Action

You can now validate the action by referencing it in a workflow file. For
example, [`ci.yml`](./.github/workflows/ci.yml) demonstrates how to reference an
action in the same repository.

```yaml
steps:
  - name: Checkout
    id: checkout
    uses: actions/checkout@v3

  - name: Test Local Action
    id: test-action
    uses: ./
    with:
      milliseconds: 1000

  - name: Print Output
    id: output
    run: echo "${{ steps.test-action.outputs.time }}"
```

For example workflow runs, check out the
[Actions tab](https://github.com/actions/typescript-action/actions)! :rocket:

## Usage

After testing, you can create version tag(s) that developers can use to
reference different stable versions of your action. For more information, see
[Versioning](https://github.com/actions/toolkit/blob/master/docs/action-versioning.md)
in the GitHub Actions toolkit.

To include the action in a workflow in another repository, you can use the
`uses` syntax with the `@` symbol to reference a specific branch, tag, or commit
hash.

```yaml
steps:
  - name: Checkout
    id: checkout
    uses: actions/checkout@v3

  - name: Test Local Action
    id: test-action
    uses: actions/typescript-action@v1 # Commit with the `v1` tag
    with:
      milliseconds: 1000

  - name: Print Output
    id: output
    run: echo "${{ steps.test-action.outputs.time }}"
```
