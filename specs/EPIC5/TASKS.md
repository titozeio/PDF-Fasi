# EPIC5 - Task Backlog

## Status

`closed`

## Task prefixes legend:

- `[ ]` pending
- `[-]` in progress
- `[!]` blocked
- `[<]` ready for review
- `[>]` review in progress
- `[x]` done

`[Tn]` (after the status, for example, [ ] [T0]) : is the id of the task. (In the example, the id would be `T0`)
`[Blocked by]` (list of task ids) : indicates which tasks are blocking this task (if any). (For example, `[Blocked by T0]`).

## US1: As a developer, I want tests to run automatically on `push` and `pull_request` events targeting `main`, so that I can trust the branch before merging

[<] [T1] Define the GitHub Actions workflow entry points, jobs, and required Node/Electron test steps for `main`.
[<] [T2] Add the workflow that runs the project tests on `push` and `pull_request` to `main`.
[<] [T3] Add workflow verification or documentation notes for the CI trigger and test behavior.

## US2: As a maintainer, I want documentation publishing to run automatically from `main`, so that project docs stay current without manual steps

[<] [T4] Define the documentation publishing target and the workflow step that builds the docs artifact.
[<] [T5] Add the workflow job that publishes the documentation automatically from `main`.
[<] [T6] Document the docs publishing output and the branch conditions that trigger it.

## US3: As a maintainer, I want the latest release to refresh automatically on `push` and `pull_request` events targeting `main`, so that users can always download the newest stable build

[<] [T7] Define how the workflow will identify the latest release payload and when it should refresh it.
[<] [T8] Add the release update step that refreshes the `latest-release` output from `main`.
[<] [T9] Add verification for the release refresh flow so the latest release stays aligned with the main branch output.

## US4: As a maintainer, I want routine version tags to bump automatically on `main`, so that release versioning stays consistent without manual bookkeeping

[<] [T10] Define the version source and the automatic bump rule for normal version increments.
[<] [T11] Add the tagging step that creates the next routine version tag on `main`.
[<] [T12] Protect manual major version jumps so the workflow does not auto-promote major releases.

## US5: As a user, I want an installable artifact to be attached to the latest release, so that I can download and run the app easily

[<] [T13] Define the installable artifact format that the release workflow should produce first.
[<] [T14] Add the packaging step that generates the installable artifact in the release pipeline.
[<] [T15] Attach the installable artifact to the latest release output.

## Ordering Notes

- Start with the CI workflow so the main branch has a validation gate.
- Then add docs publishing on the same automation backbone.
- After that, wire the latest-release refresh and tag bump flow.
- Finish by packaging and attaching the installable artifact to the release.

## Open Questions

- The initial documentation publishing target is the repository `pages` root,
  with the documentation `index` served from the root of that site.
- The initial installable artifact format is a Windows-first installer because
  it is the easiest first step.
- The version source for automatic tag bumps is `package.json.version`.

## Acceptance Notes

- The workflow should publish documentation to the root of the repository
  Pages site.
- The workflow should prefer a Windows installable for the first release
  packaging implementation.
- The workflow should read the version from `package.json` and support normal
  semantic bumps automatically.
