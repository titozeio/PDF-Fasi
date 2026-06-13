# EPIC1 - Plan

## Status

`closed`

## User Story Order

1. **US1** - Define the compression UI shell and visual language.
2. **US2** - Separate UI structure from application logic using MVVM.
3. **US3** - Enable single and batch PDF selection.
4. **US4** - Add preset-based compression choices.
5. **US5** - Add custom compression mode with advanced parameters.
6. **US7** - Add progress and processing feedback.
7. **US6** - Add export behavior for single files and batch output.

## Dependencies / Priority

- `US1` and `US2` come first because they establish the UI structure and the
  separation needed for the rest of the feature slice.
- `US3` depends on the UI shell and the MVVM structure being in place.
- `US4` and `US5` depend on file selection and the compression workflow.
- `US7` depends on the compression workflow being able to report status.
- `US6` comes near the end because export behavior should be tied to the final
  compression flow.

## Open Questions

- The exact compression engine remains open.
- The exact custom compression parameter set may evolve during implementation.
- The final packaging details are still open and may influence the export flow.

## Acceptance Notes

- The epic should ship as a polished vertical slice, not as a prototype.
- UX/UI work is part of the scope of the epic.
- The renderer layer should follow MVVM boundaries and keep business logic out
  of the view.

