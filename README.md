# PDF-Fasi

Desktop PDF utility focused on fast, local compression.

## Current State

- Electron desktop app
- Direct entry into the compression workflow
- Local PDF selection, presets, custom controls, progress, and export
- CI, documentation publishing, release automation, and routine tags are set up
- The latest release now ships a Windows portable executable and a macOS DMG
  for direct download and launch
- First two epics are complete and the next epic will add the main app menu

## Quick Start

Run the local helper script from the project root:

```bat
run-local.bat
```

The script will:

1. install dependencies if `node_modules` is missing
2. run the unit tests
3. start the Electron app

If you only want to run the checks without opening the app, use:

```bat
run-tests.bat
```

That script will only install dependencies if needed and run the unit tests.

## Manual Commands

If you want to run the steps yourself:

```powershell
npm.cmd install
npm.cmd test
npm.cmd start
```

## Notes

- Use `npm.cmd` on Windows to avoid PowerShell execution policy issues.
- The app opens directly into the compression screen.
