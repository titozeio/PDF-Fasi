# Architecture

## Purpose

PDF-Fasi is a local-first desktop application for working with PDF files.
The first release focuses on compression, with future PDF workflows added
incrementally.

## Chosen Stack

- Desktop shell: Electron.
- UI stack: HTML, CSS, and JavaScript.
- UI pattern: MVVM.
- Runtime split:
  - Main process for app lifecycle, native integration, and file orchestration.
  - Renderer process for the user interface.
  - Preload layer for a narrow, controlled bridge between UI and native APIs.

## Core Principles

- Keep the app lightweight in behavior even if the desktop shell is not the
  smallest possible option.
- Keep all PDF processing local on the user's machine.
- Prefer simple, well-documented flows over complex abstractions.
- Design for usability and accessibility first.
- Add features iteratively, starting with compression.
- Treat each epic as a vertical slice that should feel like a finished product,
  not a prototype.
- Finish UX and UI polish for a feature before moving to the next epic.
- For the initial product, open directly into the compression experience rather
  than adding a home dashboard that only adds an extra click.

## Data And Storage

- No database is required for the initial scope.
- Store only small local application data when needed, such as user settings or
  recent items.
- Keep document handling file-based and local.

## PDF Processing

- PDF compression is the first production feature.
- Processing happens locally and should be isolated from the UI layer.
- Future features such as merge, split, conversion, and simple editing should
  reuse the same local processing approach.

## Packaging

- Target Windows first, while keeping macOS support in scope.
- Package the app as a desktop installer or distributable build suitable for
  end users on each platform.
- Keep release packaging simple at the start and refine it as the product grows.

## Developer Practices

- Use a small Electron codebase with clear separation between UI and
  application logic.
- Organize the presentation layer with MVVM so the UI stays reactive and the
  business logic stays separated from the view.
- Keep the preload bridge minimal and explicit.
- Favor incremental changes that can be verified quickly.
- Run GitHub Actions CI on `push` and `pull_request` events targeting `main`
  so the branch stays validated before merge.
- Publish the documentation site from the repository `docs/` directory on
  `push` to `main`, with `docs/index.html` acting as the Pages entry point
  and the current epic docs mirrored into the site for easy browsing.
- Refresh the `latest` GitHub release from `push` events to `main`, while
  keeping `pull_request` runs as preview builds of the same release payload
  and creating routine tags in the same workflow.
- Use `package.json.version` as the release source of truth and bump routine
  versions automatically as minor releases by default, leaving major jumps to
  maintainers.
- Package the first installable release as a Windows-first ZIP bundle so the
  release workflow stays simple and dependable before introducing heavier
  installer tooling.
- Document any future architectural change before implementing it.
- Follow `docs/DESIGN.md` as the source of truth for visual tokens, layout
  rhythm, and interaction style.
- Include UX/UI work in the epic scope so features ship polished and usable.

## Open Decisions

- The exact PDF compression engine is not decided yet.
- The packaging toolchain is not finalized yet.
- A richer persistence layer may be added later if features require it.
