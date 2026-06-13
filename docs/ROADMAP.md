# ROADMAP

Status legend:

- `new`
- `spec`
- `plan`
- `tasks`
- `implement`
- `review`
- `done`

| ID    | Name               | Objective                                                                                                                                                              | Status    | Finished |
| ----- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | -------- |
| EPIC0 | First product epic | Create the basic foundation of the project: agents constitution, initial specs, architecture and initial roadmap so the project can start normal SDD Sprint execution. | done | 2026-06-12 |
| EPIC1 | PDF compression MVP | Deliver the first polished vertical slice of the product: local PDF compression with a simple, attractive and usable desktop experience. | done | 2026-06-13 |
| EPIC5 | CI/CD and releases | Automate tests, documentation publishing, GitHub Pages, tags, and latest-release packaging for every sprint. | done | 2026-06-13 |
| EPIC6 | Main app menu | Add a central menu screen that gives the user clear entry points to compression and future PDF workflows. | spec |          |
| EPIC2 | Merge and split PDFs | Add local PDF merge and split workflows as a finished feature slice with matching UI/UX polish. | new |          |
| EPIC3 | PDF conversion | Add conversion to and from other formats as a finished feature slice, keeping the local-first desktop workflow. | new |          |
| EPIC4 | Simple PDF editing | Add simple in-app PDF editing as a polished, limited-scope feature slice. | new |          |


## Notes

- `EPIC0` is the default epic for each SDD project needed to start normal SDD.
- Each epic should live in `specs/EPICXX/` with its own focused docs.
- `EPIC0` ships scaffolded and starts in `implement`.
- Each epic should be planned and implemented as a finished vertical slice, with
  UX/UI considered part of the epic rather than a separate later pass.
- Keep roadmap entries short and actionable.
