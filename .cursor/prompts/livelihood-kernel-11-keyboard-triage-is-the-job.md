# LK-11 — Keyboard triage is the findings job

**Do not fork PT-06 or WD-05** palette maps. **Do not fork IS-10** if review-detail already mounts `FindingKeyboardTriageHost` with Alt+J/K and Alt+1–3 — then close residuals (Shift+? work-first, visible-band, draft save docs). This file is authorized to make Working **work** from the keyboard: dispositions, next/previous finding, save draft, finalize-when-ready — not a map of routes.

## Goal

A Working architect can: move next/previous finding in the **visible band** (IS-07), apply Alt+1–3 dispositions, Save draft (existing Ctrl+Shift+S / LK-02 undo), and Finalize from the palette **when ready**, without the mouse, on review-detail. `KEYBOARD_SHORTCUTS.md` lists **work actions before navigation** for Working. No new single-letter shortcuts (WCAG 2.1.4).

## Why

Professional instruments are keyboard-first after muscle memory. A map of destinations is an evaluator overlay. Livelihood triage is the job.

## Context

- `archlucid-ui/docs/KEYBOARD_SHORTCUTS.md`
- `shortcut-registry.ts` / `command-palette-handler-actions.ts`
- `use-review-workbench-shortcuts.ts`
- `FindingKeyboardTriageHost` / `useFindingCardShortcuts`
- `AppShellSyncKeyboardShortcutListener`
- IS-07 two bands
- LS-07 dual-pane keyboard leftover — do not fork if Alt+J/K already moves workbench selection; mount the same host

## What to build

1. Review-detail Working: when focus is not in an input, Alt+J/K move findings in the visible band. If that only works on `/governance/findings`, mount the same host on review-detail lists.
2. Shift+? (or existing overlay) lists work actions before nav for Working.
3. Draft editor: document undo shortcuts from LK-02 if landed; otherwise do not invent a second save.
4. Vitest: review-detail findings list keyboard triage; no bare `E` / `J` without modifier; Guided unchanged.

## Acceptance criteria

- Working review-detail findings can be triaged without a mouse after Tab into the list.
- Shift+? does not tell Working users that shortcuts only navigate.

## Constraints

- Do not collapse tabs to reduce shortcut surface.
- Do not implement IS-11 presenter keys here.
