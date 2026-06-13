# EPIC5 - Plan

## Status

`closed`

## User Story Order

1. **US1** - As a developer, I want tests to run automatically on `push` and `pull_request` events targeting `main`, so that I can trust the branch before merging.
2. **US2** - As a maintainer, I want documentation publishing to run automatically from `main`, so that project docs stay current without manual steps.
3. **US3** - As a maintainer, I want the latest release to refresh automatically on `push` and `pull_request` events targeting `main`, so that users can always download the newest stable build.
4. **US4** - As a maintainer, I want routine version tags to bump automatically on `main`, so that release versioning stays consistent without manual bookkeeping.
5. **US5** - As a user, I want an installable artifact to be attached to the latest release, so that I can download and run the app easily.

## Dependencies / Priority

- `US1` comes first because the CI validation flow is the safety net for all
  other automation.
- `US2` follows once the main branch workflow is established, so docs
  publishing can reuse the same automation backbone.
- `US3` depends on the main branch workflow and release automation being
  stable enough to refresh the latest downloadable output.
- `US4` comes after the release workflow is clear enough to support automatic
  tag bumps for normal version increments.
- `US5` comes last because the installable artifact should attach to the
  release workflow after the release mechanics are in place.

## Open Questions

- Which documentation publishing target should the workflow update first.
- Which artifact format is the most practical installable for the initial
  release automation.
- Whether the tag bump should be derived from the repository state or from a
  version file once the workflow is implemented.

## Acceptance Notes

- The workflow should run on `push` and `pull_request` targeting `main`.
- The release automation should update the latest stable output on every
  qualifying `main` change.
- Normal semantic version bumps should be automated.
- Major version jumps remain a manual maintainer decision.
- The epic is ready to move to `TASKS.md` once the PM approves this order.
