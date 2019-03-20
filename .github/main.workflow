workflow "Wait for CI to Pass" {
  on = "push"
  resolves = "Celebrate"
}

action "Wait for Appveyor" {
  uses = "./.github/wait-ci"
  args = "appveyor"
  secrets = ["GITHUB_TOKEN"]
}

action "Wait for Travis" {
  uses = "./.github/wait-ci"
  args = "travis-ci"
  secrets = ["GITHUB_TOKEN"]
}

action "Celebrate" {
  uses = "docker://debian:stable-slim"
  needs = ["Wait for Travis", "Wait for Appveyor"]
  runs = "echo Hooray!"
}
