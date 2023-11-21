# GH API Confine

![Licence](https://img.shields.io/github/license/matthiaszepper/gh-api-confine)
[![GitHub Super-Linter](https://github.com/actions/typescript-action/actions/workflows/linter.yml/badge.svg)](https://github.com/super-linter/super-linter)
![CI](https://github.com/actions/typescript-action/actions/workflows/ci.yml/badge.svg)

**GH API Confine** (GitHub API Quota Limiter) is a Github action step designed to help you use the GitHub API more effectively.

With **GH API Confine**, you can easily monitor your remaining GitHub API quota and act accordingly. Specify a threshold (relative or absolute) and either delay or terminate your workflow, if your quota falls below the cutoff.

Prepending API-heavy jobs with **GH API Confine** saves your precious API requests for smaller jobs, instead of wasting them on attempting workflow runs that would anyway fail half-way through.

## Features

![You are going too fast! F. Murray Abraham alias Antonio Salieri, from the film Amadeus (1984)](badges/toofast.webp)

- **Quota monitoring:** The step keeps track of your GitHub API quota, helping you stay within your allocated limits.

- **Customizable action:** Define how **GH API Confine** should respond when your API quota falls below a specified threshold. Choose between three modes:
  - **Peep (Observe):** Take no further action beyond checking the quota.
  - **Sleep (Wait):** Delay the completion of the step until shortly after your API quota renews, maximizing the chances of successful job completion. Set the `alarm` input to limit the maximum sleep time to go easy on your Github spending.
  - **Sweep (Terminate):** Immediately terminate the workflow run to prevent further API usage if your quota is too low.

## Usage

The most simple way to use this action step is within a separate job that precedes the main job. Since the `api_quota_check` job will fail if your API quota is too low, `some_other_job` will not not even start and the workflow run is stopped.

_sweep_ is the default `actionToTake`, so the `with:` specification can be omitted entirely. If you set it to _sleep_ instead, the `api_quota_check` will delay it's completion until shortly after the allotted quota renews. This does not guarantee the successful completion of your job (in particular if multiple workflows are running in parallel), but maximizes the chances.

```yaml
jobs:
  api_quota_check:
    name: Check API quota
    runs-on: ubuntu-latest

    steps:
      - uses: MatthiasZepper/gh-api-confine@v1
        with:
          actionToTake: "sweep"

  some_other_job:
    runs-on: ubuntu-latest
    needs: api_quota_check
```

### Inputs

| Input         | Description                                  | Required| Default |
|---------------|----------------------------------------------|---------|---------|
| `actionToTake`         | Select between 'peep', 'sleep' and 'sweep'.                       | No     | sweep   |
| `threshold`     |  The API request quota minimum. Can be given as fraction of the limit (0.2 ; 20%) or absolute number of requests (50). Percentages or decimal numbers in the open interval (0,1) are interpreted as fractions, other integers as absolute. Irrelevant if 'peep' was chosen as action.   | No     |   10%      |
| `delay`| If 'sleep' is set as `actionToTake`, _oversleep_ the quota reset by an additional delay of `n` seconds. | No      | 1    |
| `alarm`| Limit the maximum time to 'sleep' by setting an figurative alarm clock to `n` seconds. If no earlier quota reset occurs, sweep instead. | No      | 1800    |
| `resource`| Monitored Github API resource: One of 'core', 'search', 'graphql', 'integration_manifest' or 'code_scanning_upload'    | No      | core     |
| `token`       | Github API token to use for the action. Defaults to your current one.   | No      | ${{github.token}}     |

### Outputs

| Output | Description |
|--------|-------------|
| `result` | Failure or success, can be used by downstream steps. |
| `remaining_abs` | Number of absolute requests that remained for the specified resource. |
| `remaining_rel` | Relative requests that remained for the specified resource. |

Additionally, the `$GITHUB_REMAINING_API_QUOTA` environment variable is set.

## Advanced usage

 Only the essential functionality is available as `actionToTake`, but custom [expressions](https://docs.github.com/en/actions/learn-github-actions/expressions) can be used to implement more elaborate workflow logic.

### Run a subsequent step despite failure

`${{ failure() }}` returns true when any previous step of a job fails. Therefore, the salvage step does not have to be immediately subsequent to **GH API Confine**. Use an `id` and the step's conclusion to run in case of a specific step's failure.

 ```yaml
jobs:
  api_quota_check:
    name: Check API quota
    runs-on: ubuntu-latest

    steps:
      - uses: MatthiasZepper/gh-api-confine@v1
        id: confine
      - if: ${{ failure() }}
        run: echo "I will run if any previous step failed!"
      - if: ${{ failure() && steps.confine.conclusion == 'failure' }}
        run: echo "I will only run if the 'confine' step failed."

```

### Hard workflow cancellation

Despite the bold name `sweep`, **GH API Confine** has not the sufficient permissions to actually cancel a running workflow. It just fails the step, which possibly fails the job, which might also fail the whole workflow.

To enforce an immediate workflow cancellation, you will need to issue the respective `gh` commands. Additionally, you must explicitly confer the permissions to interact with your GitHub actions in the job declaration.

 ```yaml
jobs:
  api_quota_check:
    name: Check API quota
    runs-on: ubuntu-latest
    permissions:
      actions: 'write'

    steps:
      - uses: MatthiasZepper/gh-api-confine@v1
        id: confine
      - if: ${{ failure() && steps.confine.conclusion == 'failure' }}
        run: |
          gh run cancel ${{ github.run_id }}
          gh run watch ${{ github.run_id }}
        env:
          GITHUB_TOKEN: ${{github.token}} 
```

### Monitor API usage

Predicting the number of API requests that a particular step/job will make is difficult, since large returns might be split into multiple requests subject to pagination. Therefore, you can use **GH API Confine** also for monitoring API requests only.

You can [`join`](https://docs.github.com/en/actions/learn-github-actions/expressions#join) the outputs of multiple steps or even export them to JSON.

```yaml
jobs:
  api_quota_check:
    name: Check API quota
    runs-on: ubuntu-latest
    outputs:
      remaining:  ${{ join(steps.*.outputs.remaining_abs, ',') }}

    steps:
      - name: Monitoring API step I
        uses: MatthiasZepper/gh-api-confine@v1
        id: check_quota
        with:
          actionToTake: "peep"
      - run: echo "Replace me with a step to monitor"
      - name: Monitoring API step II
        uses: MatthiasZepper/gh-api-confine@v1
        id: check_quota_2
        with:
          actionToTake: "peep"
      - run: echo "Replace with another monitored step"
      - name: Monitoring API step III
        uses: MatthiasZepper/gh-api-confine@v1
        id: check_quota_3
        with:
          actionToTake: "peep"

  monitoring_job:
    needs: api_quota_check
    runs-on: ubuntu-latest

    steps:
      - name: Print quota
        run:
          echo "Remaining API requests throughout the job
          ${{needs.api_quota_check.outputs.remaining}}"
```

## Development

I gladly welcome suggestions for improvement, bug reports and code contributions to this project. If you'd like to contribute code, the best way to get started is to create a personal fork of this repository. Subsequently, use a new branch to develop your feature or contribute your bug fix.

Once you're ready, simply open a pull request to the dev branch and I'll happily review your changes. Thanks for your interest in contributing!

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

### Update the code

The [`src/`](./src/) directory is the heart of this action. It contains the
source code that will be run when your action is invoked. Create a new branch and edit the contents of `src/`. Format, test, and build the action

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

Commit your changes and push them to the repository:

```bash
git add .
git commit -m "My first contribution is ready!"
git push
```

### Validate the updated action

You can now validate the action by referencing it in a workflow file. For
example, [`check-dist-and-action.yml`](./.github/workflows/check-dist-and-action.yml) demonstrates how to reference an
action in the same repository.

```yaml
steps:
  - name: Checkout
    id: checkout
    uses: actions/checkout@v4

  - name: Test the action locally
    id: test-action
    uses: ./
    with:
      actionToTake: "peep"
```
