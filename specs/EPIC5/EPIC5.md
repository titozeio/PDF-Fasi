# EPIC5 - CI/CD and releases

## Objective

Automate the project workflow on `push` and `pull_request` events targeting
`main` so tests, documentation publishing, version tagging, latest-release
updates, and distributable artifacts happen with minimal manual work.

## User Stories

**US1**: As a developer, I want tests to run automatically on `push` and
`pull_request` events targeting `main`, so that I can trust the branch before
merging.

**US2**: As a maintainer, I want documentation publishing to run
automatically from `main`, so that project docs stay current without manual
steps.

**US3**: As a maintainer, I want the latest release to refresh automatically on
`push` and `pull_request` events targeting `main`, so that users can always
download the newest stable build.

**US4**: As a maintainer, I want routine version tags to bump automatically on
`main`, so that release versioning stays consistent without manual bookkeeping.

**US5**: As a user, I want an installable artifact to be attached to the
latest release, so that I can download and run the app easily.

## Scope

- Run validation on every `push` and `pull_request` targeting `main`.
- Publish documentation automatically from the main branch workflow.
- Refresh the `latest-release` output on every qualifying `main` update.
- Bump version tags automatically for normal version increments.
- Keep major version jumps manual when a deliberate breaking-release step is
  needed.
- Produce an installable artifact in the release output when the build
  pipeline can generate one reliably.

## Notes

- The epic is focused on CI/CD automation and release hygiene.
- The versioning flow should support the normal next-step bump pattern, such as
  `0.1.0` to `0.2.0`.
- Major version changes, such as `0.5.0` to `1.0.0`, remain a manual decision.
- The release workflow should remain local-first in spirit: build artifacts
  should be generated from the repository workflow, not from external services
  that require product data.

## Related Files

- `docs/ROADMAP.md`
- `docs/ARCHITECTURE.md`
- `docs/DESIGN.md`
- `specs/EPIC5/PLAN.md`
- `specs/EPIC5/TASKS.md`
