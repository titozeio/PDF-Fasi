# EPIC1 - Task Backlog

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

## US1: As a user, I want a modern, intuitive, and usable compression UI so that I can handle the app with ease

[x] [T1] Define the compression screen layout, visual hierarchy, and core interaction states for the first polished UI slice.
[x] [T2] Implement the base compression screen shell in the renderer with the agreed visual language.

## US2: As a developer, I want the UI structure separated from the business logic so that the app can evolve cleanly with an MVVM architecture

[x] [T3] Create the initial MVVM structure for the compression feature, including view-model boundaries and app-state ownership.
[x] [T4] Wire the screen shell to the view-model layer with explicit, minimal data and action bindings.

## US3: As a user, I want to select more than one PDF at a time so that I can compress files in batch

[x] [T5] Implement local file selection for single and multiple PDF inputs.
[x] [T6] Render the selected file list and basic file management feedback in the compression screen.

## US4: As a user, I want to choose from a few compression presets so that I can use the app without dealing with complex parameters

[x] [T7] Define a small preset set for compression and connect it to the feature state.
[x] [T8] Add preset selection controls and apply the chosen preset to the compression flow.

## US5: As a user, I want a custom compression mode with advanced parameters so that I can tune the output when I need more control

[x] [T9] Design and implement the custom compression panel with advanced parameters.
[x] [T10] Validate and map custom parameters into the compression job configuration.

## US7: As a user, I want to see compression progress so that I know how the process is advancing

[x] [T11] Add progress and status feedback during compression.
[x] [T12] Surface success, warning, and error states clearly in the UI.

## US6: As a user, I want to export a single compressed PDF or a `.zip` file with multiple compressed PDFs so that I can save the results in the right form

[x] [T13] Implement export handling for a single compressed PDF.
[x] [T14] Implement batch export handling that bundles multiple compressed PDFs into a `.zip`.

## Ordering Notes

- Start with the UI shell and MVVM boundary tasks.
- Then add file selection and preset-driven compression.
- Keep custom compression, progress, and export aligned with the final flow.
- The first usable slice should remain visually polished throughout implementation.
