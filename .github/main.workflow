workflow "Wait for CI to Pass" {
  on = "push"
  resolves = "Celebrate"
}

action "Wait for CI" {
  uses = "./.github/wait-ci"
  args = "travis-ci"
  secrets = ["GITHUB_TOKEN"]
}

action "Celebrate" {
  uses = "docker://debian:stable-slim"
  needs = "Wait for CI"
  runs = "echo Hooray!"
}
