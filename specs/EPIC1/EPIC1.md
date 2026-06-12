# EPIC1 - PDF compression MVP

## Objective

Deliver the first polished vertical slice of the product: a local PDF
compression experience with a simple, attractive, and usable desktop interface.

## Status

`implement`

## User Stories

**US1**: As a user, I want a modern, intuitive, and usable compression UI so
that I can handle the app with ease.

**US2**: As a developer, I want the UI structure separated from the business
logic so that the app can evolve cleanly with an MVVM architecture.

**US3**: As a user, I want to select more than one PDF at a time so that I can
compress files in batch.

**US4**: As a user, I want to choose from a few compression presets so that I
can use the app without dealing with complex parameters.

**US5**: As a user, I want a custom compression mode with advanced parameters so
that I can tune the output when I need more control.

**US6**: As a user, I want to export a single compressed PDF or a `.zip` file
with multiple compressed PDFs so that I can save the results in the right form.

**US7**: As a user, I want to see compression progress so that I know how the
process is advancing.

## Scope

- Open the app directly into the compression experience, without a separate
  home menu for the MVP.
- Design and implement the compression screen and its interaction model.
- Separate the UI structure from the application logic using MVVM.
- Support single-file and batch PDF selection.
- Provide a small set of presets plus one custom mode.
- Support result export for single and multiple inputs.
- Show progress and clear feedback during processing.

## Notes

- This epic is intentionally a full vertical slice, not a prototype pass.
- UX/UI polish is part of the epic definition.
- The MVP intentionally avoids a home dashboard so the user lands directly on
  the compression workflow.
- The compression engine and exact parameter set may still evolve during
  implementation, but the user-facing behavior should stay simple.
