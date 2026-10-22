# CR-08 — Remaining eight-hour zoom clip besides workbench columns

**Do not fork LS-10** (three-column workbench at 200% / 1280px). **Do not fork WA-24 / FD-09** (review-detail / shell scrollport). **Do not collapse** desktop review tabs behind **More**. This file is leftover **chrome** that still clips identity at 200% zoom or 1280px width: command palette, stamp/finalize band, Architecture dual-pane, and header search.

## Goal

Working 1280×720 and 200% zoom: palette, stamp band, dual-pane finding identity, and header search remain operable without horizontal clip of title/status. Scroll inside the panel is allowed. A **More** menu for review workspace tabs is forbidden.

## Why

LS-10 can fix workbench columns while the palette and stamp still eat the finding title. Eight-hour use includes zoomed projectors (R4). Clipped identity is a career-defense failure in the room.

## Context

- `operator-shell-eight-hour-zoom.test.tsx` — extend fixtures; do not fork FD-09 shell assertions
- `CommandPalette.tsx`
- Pre-finalize stamp / `RunDetailOverviewTransparencyTrail` band
- `ArchitectureFindingsDualPane.tsx` (selection is LS-01; this prompt is clip only)
- Header `GlobalSearchBar`

## What to build

1. Run or extend the eight-hour zoom fixture to palette open, stamp band, and dual-pane. Inventory clipped `h1` / status / finding title.
2. Fix overflow with wrapping, min-width 0, and panel scroll. Do not hide review tabs.
3. Vitest: 200% / 1280px fixture asserts those surfaces expose title or status text (same pattern as FD-09).

## Acceptance criteria

- At 200% zoom, command palette results and stamp band do not clip the package identity to an ellipsis-only control with no accessible name.
- Review-detail visible tabs stay a full strip (`moreTabIds: []`).

## Constraints

- Do not restore system-wide breadcrumbs (TB-2090).
- Do not invent live presence avatars.
