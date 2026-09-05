# IS-10 — Keyboard does the work on the desk

**Do not fork PT-06 or WD-05.** Palette already has Save / Finalize / dispositions / Undo (LI-07 / LD-09). Global Alt+letter still mostly **navigates**. This file makes Working **work** from the keyboard on the findings desk and draft editor without adding bare character-key shortcuts (WCAG 2.1.4).

## Goal

A Working architect can: move next/previous finding, apply Alt+1–3 dispositions, Save draft (Ctrl+Shift+S already on workbench), and Finalize from the palette **when ready**, without the mouse, on review-detail and the draft editor. Document in `KEYBOARD_SHORTCUTS.md` (AD-10 truth: header is inside the listener — do not resurrect the old lie). No new single-letter shortcuts.

## Why

Professional instruments are keyboard-first after muscle memory. A map of routes is an evaluator overlay. Livelihood triage is the job.

## Context

- `archlucid-ui/docs/KEYBOARD_SHORTCUTS.md`
- `shortcut-registry.ts` / `command-palette-handler-actions.ts`
- `use-review-workbench-shortcuts.ts`
- `FindingKeyboardTriageHost` / `useFindingCardShortcuts`
- `AppShellSyncKeyboardShortcutListener`
- IS-07 bands: next/prev must respect the visible band

## What to build

1. Review-detail Working: when focus is not in an input, Alt+J/K move findings in the **visible band** (IS-07). If that already works only on `/governance/findings`, mount the same host on review-detail lists.
2. Palette “Finalize review” remains gated on readiness (existing). Add palette “Open checklist band” only if IS-07 landed; otherwise skip.
3. Draft editor: Ctrl+S or existing Ctrl+Shift+S documented as Save; do not fight autosave with a second store.
4. Shift+? lists work actions before nav for Working.
5. Vitest: review-detail findings list keyboard triage; no bare `E` / `J` without Alt; Guided unchanged.

## Acceptance criteria

- Working review-detail findings can be triaged without a mouse after Tab into the list.
- Shift+? does not tell Working users that shortcuts only navigate.
- WCAG 2.1.4: no new printable-key-only shortcuts.

## Constraints

- Do not collapse tabs to reduce shortcut surface.
- Do not implement IS-11 presenter keys here.
