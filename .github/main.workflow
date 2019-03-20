workflow "Wait for CI to Pass" {
  on = "push"
  resolves = "Celebrate"
}

action "Wait for Circle CI" {
  uses = "./.github/wait-ci"
  args = "circleci-checks"
  secrets = ["GITHUB_TOKEN"]
}

action "Wait for Travis" {
  uses = "./.github/wait-ci"
  args = "travis-ci"
  secrets = ["GITHUB_TOKEN"]
}

action "Celebrate" {
  uses = "docker://debian:stable-slim"
  needs = ["Wait for Travis", "Wait for Circle CI"]
  runs = "echo Hooray!"
}
