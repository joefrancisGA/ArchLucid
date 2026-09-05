# LS-07 — Dual-pane keyboard moves the shared selection

**Do not fork IS-10, PT-06, or WD-05.** Review-detail findings lists already have `FindingKeyboardTriageHost` / Alt+J/K. This file is the leftover: **Architecture dual-pane list is a separate focus world.** After LS-01 shares selection, keyboard on that list must update the same id so evidence and diagram stay on the finding being triaged.

## Goal

When focus is in the dual-pane findings list (workbench on or Architecture tab), Alt+J/K move the **shared** `selectedFindingId`. Alt+1–3 dispositions still require Execute+ and the existing confirm path. No bare character-key shortcuts (WCAG 2.1.4).

## Why

Professionals triage from the keyboard. A mouse-only Architecture column re-breaks the daily loop LS-01 just closed.

## Context

- `ArchitectureFindingsDualPane.tsx` finding buttons/links
- `useFindingCardShortcuts` / `FindingKeyboardTriageHost`
- `use-review-workbench-shortcuts.ts`
- IS-07 bands: next/prev stay inside the **visible** band when bands exist
- `KEYBOARD_SHORTCUTS.md` (AD-10 truth)

## What to build

1. Dual-pane finding rows are focusable (`data-finding-id`, same contract as findings cards).
2. Mount or reuse the triage host so Alt+J/K call `setSelectedFindingId` on the workbench context when present, else local selection (workbench off).
3. Document in `KEYBOARD_SHORTCUTS.md` under Review page: Architecture linked view uses the same combos.
4. Vitest: dual-pane Alt+J changes context id when workbench on; no `J` without Alt.

## Acceptance criteria

- Working architect can walk findings on the Architecture tab without a mouse and see diagram + evidence follow.
- Shift+? still lists work actions for Working.
- WCAG 2.1.4: no new printable-key-only shortcuts.

## Constraints

- Do not implement IS-11 Presenter keys.
- Do not collapse tabs to shrink the shortcut surface.
