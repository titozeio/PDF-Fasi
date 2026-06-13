# Design System

## Purpose

This document defines the visual language of PDF-Fasi so the app stays
consistent across epics, screens, and future features.

The overall style should feel:

- calm
- precise
- modern
- trustworthy
- efficient

## Design Principles

- Keep the interface simple and task-focused.
- Make the primary action obvious on every screen.
- Use progressive disclosure for advanced options.
- Prefer clear state feedback over decorative elements.
- Keep spacing generous enough to feel calm, but dense enough for a utility
  app.

## Color System

The app should use a light-first palette with a dark, professional character.
Colors should support readability, compression progress, and status feedback.

| Token | Purpose | Suggested color |
| --- | --- | --- |
| `bg` | App background | `#F4F6F8` |
| `surface` | Cards, panels, sheets | `#FFFFFF` |
| `surface-alt` | Secondary blocks | `#E9EEF3` |
| `text-primary` | Main text | `#111827` |
| `text-secondary` | Supporting text | `#5B6472` |
| `border` | Dividers and outlines | `#D7DEE7` |
| `primary` | Main action, active state | `#0F766E` |
| `primary-hover` | Hover/active emphasis | `#115E59` |
| `accent` | Highlights and secondary emphasis | `#E76F51` |
| `success` | Done/success feedback | `#15803D` |
| `warning` | Attention states | `#D97706` |
| `error` | Failure states | `#DC2626` |

Notes:

- Use `primary` for the main compression action and key toggles.
- Use `accent` sparingly for emphasis, not as a second primary color.
- Status colors should always remain readable on white surfaces.

## Typography

- Headings: `Space Grotesk`
- Body: `IBM Plex Sans`
- Numeric or technical data: `IBM Plex Mono`

Fallbacks:

- `Space Grotesk`, `IBM Plex Sans`, and `IBM Plex Mono` should fall back to
  clean system sans/mono fonts when unavailable.

Typography rules:

- Use a strong size hierarchy with short, readable headings.
- Keep body text at a comfortable desktop reading size.
- Use monospace only for file sizes, paths, technical values, or diagnostic
  information.

## Layout

- Base spacing unit: `8px`.
- Preferred corner radius: `12px`.
- Use cards and panels with clear separation instead of crowded borders.
- Keep the main workflow in a single dominant view.
- Reserve secondary panels for presets, custom controls, and results.
- The compression screen should fit a full 1080p desktop viewport without
  forcing page-level vertical scroll in the normal working state.
- When content needs to grow, prefer internal scrolling for lists or panels
  over making the whole window scroll.

## Components

### Primary Button

- Filled `primary` background.
- Clear label with one action only.
- Reserve for the main compression action.

### Secondary Button

- Neutral surface with border.
- Use for back, cancel, remove, or secondary actions.

### File Row

- Show file name, size, and status.
- Keep actions compact and predictable.
- Make row-level feedback visible during processing.
- Status pills should use color-coded variants for `Ready`, `Queued`,
  `Processing`, `Done`, and `Error` states.
- Status feedback must remain readable if color is not perceived clearly.

### Preset Chip

- Use compact selectable chips or segmented options.
- The active preset must be visually obvious.
- Use the preset labels `Print`, `Ebook`, and `Screen`.
- `Print` should communicate lower compression and higher quality.
- `Ebook` should communicate the balanced middle ground.
- `Screen` should communicate higher compression and smaller output.

### Custom Panel

- Hide advanced controls until the custom mode is selected.
- Group related parameters together and avoid overwhelming the user.
- The custom panel should expose JPEG quality, maximum image resolution,
  grayscale conversion, and page scale factor.
- Keep the page scale factor as a slider plus numeric input.

### Progress Area

- Show overall progress clearly.
- Surface per-file status when batch mode is active.
- Use text plus visual progress, not color alone.

## Interaction Style

- Use subtle transitions only.
- Keep animations short and purposeful.
- Prefer immediate feedback after every user action.
- Do not hide errors; explain them in plain language.

## Accessibility

- Maintain strong contrast for all text and controls.
- Ensure keyboard navigation works for every main control.
- Never rely on color alone to communicate status.
- Keep labels explicit and avoid vague icon-only actions.

## Tone

The app should feel like a focused productivity tool, not a consumer gadget.
It should be calm, efficient, and a little premium without becoming flashy.

## Compression Screen Wireframe

The MVP opens directly into this screen.

### Layout

- Top bar:
  - app name
  - short status or hint text
  - optional help affordance
- Main content:
  - left column for file input and file list
  - right column for presets, custom controls, and actions
- Bottom area:
  - progress and export feedback

### Left Column

1. File drop zone
   - primary entry point
   - supports click-to-select and drag-and-drop
   - shows a clear empty state when no files are loaded
2. Selected files list
   - one row per PDF
   - file name
   - original size
   - remove action
   - processing status when active
3. Batch summary
   - file count
   - total input size

### Right Column

1. Compression mode
   - preset selector as the default control
   - custom mode as an alternative, not the default
2. Preset area
   - small, readable preset cards or chips
   - one preset selected at a time
3. Custom area
   - hidden unless custom mode is active
   - grouped parameters only
   - no advanced overload in the first version
4. Primary action
   - `Compress` button
   - disabled until at least one valid file is selected

### Bottom Area

1. Progress block
   - overall progress bar
   - percent or step text
   - batch file counter when relevant
2. Result block
   - output status
   - before/after size summary
   - export action
   - zip behavior when more than one PDF is processed

### States

- Empty state
  - no files selected
  - instructive, not noisy
- Ready state
  - files selected
  - preset or custom mode chosen
- Processing state
  - action disabled
  - visible progress
  - clear per-file feedback in batch mode
- Success state
  - result summary visible
  - export action enabled
- Error state
  - plain-language explanation
  - recovery action visible

### Interaction Rules

- Keep the primary action in one place.
- Use progressive disclosure for custom controls.
- Prefer visible text labels over icon-only controls.
- Keep the screen readable when only one file is selected and when several are.
