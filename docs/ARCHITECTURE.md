# Architecture

## Purpose

PDF-Fasi is a local-first desktop application for working with PDF files.
The first release focuses on compression, with future PDF workflows added
incrementally.

## Chosen Stack

- Desktop shell: Electron.
- UI stack: HTML, CSS, and JavaScript.
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
- Keep the preload bridge minimal and explicit.
- Favor incremental changes that can be verified quickly.
- Document any future architectural change before implementing it.
- Include UX/UI work in the epic scope so features ship polished and usable.

## Open Decisions

- The exact PDF compression engine is not decided yet.
- The packaging toolchain is not finalized yet.
- A richer persistence layer may be added later if features require it.
