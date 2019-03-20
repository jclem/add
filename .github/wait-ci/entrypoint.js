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
  pollLoop: while (true) {
    tools.log.info('Polling check suites.')

    const {
      repository: {
        object: {
          checkSuites: {nodes: checkSuites}
        }
      }
    } = await listCheckSuites()

    checkSuiteLoop: for (const checkSuite of checkSuites) {
      if (checkSuite.app.slug !== checkSuiteSlug) {
        continue checkSuiteLoop
      }

      tools.log.info(`Found check suite, status: ${checkSuite.status}`)

      if (checkSuite.status !== 'COMPLETED') {
        await wait(5000)
        continue pollLoop
      }

      tools.log.info(
        `Check suite completed with conclusion ${checkSuite.conclusion}`
      )

      switch (checkSuite.conclusion) {
        case 'FAILURE':
        case 'TIMED_OUT':
          tools.exit.failure()
        case 'ACTION_REQUIRED':
        case 'NEUTRAL':
        case 'CANCELLED':
          tools.exit.neutral()
        case 'SUCCESS':
          tools.exit.success()
        default:
          throw new Error(
            `Unexpected check suite conclusion: "${checkSuite.conclusion}"`
          )
      }
    }

    await wait(5000)
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
      expression: tools.context.payload.after,
      headers: {
        accept: 'application/vnd.github.antiope-preview+json'
      }
    }
  )
}
