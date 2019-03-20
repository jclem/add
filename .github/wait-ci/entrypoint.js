const {Toolkit} = require('actions-toolkit')
const tools = new Toolkit()

const wait = (ms = 1000) => new Promise(res => setTimeout(res, ms))
const checkSuiteSlug = tools.arguments._[0]

if (!checkSuiteSlug) {
  throw new Error('A check suite app slug must be supplied.')
}

main()
  .then(() => {
    tools.exit.success()
  })
  .catch(err => {
    tools.log.fatal(err)
    tools.exit.failure()
  })

async function main() {
  await pollCheckSuites()
}

async function pollCheckSuites() {
  let completed = false

  pollLoop: while (!completed) {
    const checkSuites = await listCheckSuites()

    checkSuiteLoop: for (const checkSuite in checkSuites) {
      if (checkSuite.slug !== checkSuiteSlug) {
        continue checkSuiteLoop
      }

      if (checkSuite.status !== 'COMPLETED') {
        await wait(5000)
        continue pollLoop
      }

      completed = true

      switch (checkSuite.conclusion) {
        case 'FAILURE':
        case 'TIMED_OUT':
          tools.exit.failure()
        case 'ACTION_REQUIRED':
        case 'NEUTRAL':
          tools.exit.neutral()
        case 'SUCCESS':
          tools.exit.success()
        default:
          throw new Error(
            `Unexpected check suite conclusion: "${checkSuite.conclusion}"`
          )
      }
    }
  }
}

function listCheckSuites() {
  return tools.github.graphql(
    `query checkSuites($owner: String!, $repo: String!, $expression: String!) {
    repository(owner: $owner, name: $repo) {
      object(expression: $expression) {
        ... on Commit {
          checkSuites(first: 100) {
            nodes {
              app {
                slug
              }

              conclusion
              status
            }
          }
        }
      }
    }
  }`,
    {
      ...tools.context.repo(),
      expression: tools.context.payload.head_commit,
      headers: {
        accept: 'application/vnd.github.antiope-preview+json'
      }
    }
  )
}
