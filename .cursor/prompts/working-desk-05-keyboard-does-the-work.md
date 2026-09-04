# WD-05 — Keyboard does the work, not only navigation

**Do not fork PT-06.** If palette handlers are unstarted, run `professional-tool-06-keyboard-work.md`. This file is the residual: findings next/previous + disposition as palette/work chords on the review desk.

## Goal

A Working-mode architect can drive **triage and save** from the keyboard and command palette: next/previous finding, existing Alt+1–3 dispositions, save dirty draft, undo while the reversible callout is active. Shift+? documents those combos. Teaching coaches stay off in Working. Do not add a second shortcut library.

## Why

`SHORTCUTS` is still Alt+letter **route jumps**. Palette handler actions exist for save-draft and undo (`command-palette-handler-actions.ts`) but findings next/previous and disposition are not first-class palette/work chords on the review desk. VS Code / Excel / CAD bind keys to *work*. Navigation chords are table stakes (PT-09 sync listener already mounts). This prompt is **action bindings**.

## Context

- `archlucid-ui/src/lib/shortcut-registry.ts` — keep Alt+N Working route as `WORKING_MODE_NEW_REVIEW_ROUTE`
- `archlucid-ui/docs/KEYBOARD_SHORTCUTS.md`
- `archlucid-ui/src/lib/command-palette-handler-actions.ts` / `CommandPaletteWorkActionBridge.tsx`
- `useFindingCardShortcuts.ts`, `FindingKeyboardTriageHost.tsx`, `useAlertCardShortcuts.ts`
- `AppShellSyncKeyboardShortcutListener.tsx` — do not move listeners out of the shell wrap
- `FirstVisitHelpAutoOpen.tsx` / teaching inventory — Working must not auto-open
- PT-06 residual: extend handlers; do not “fix” the already-wrapped shell again

## What to build

1. Palette **handler** rows (not hrefs) on findings/alerts: next, previous, disposition commands that already exist as Alt+1–3. Reuse functions; do not duplicate API calls.
2. Palette save-draft remains on `/architecture/architectures/*` when dirty. Undo row only when `ReversibleMutationSuccessCallout` is active (or equivalent live undo token) — do not offer undo that no-ops.
3. Document chords in Shift+? and `KEYBOARD_SHORTCUTS.md`. Prefer Alt/Ctrl (WCAG 2.1.4 — no new bare single-letter globals except existing `/` search).
4. Working: no auto-open shortcut coaches / first-visit help. Shift+? remains.
5. Keep `isEditableTarget` input guard.
6. Tests next to `keyboard-shortcuts-*.test.tsx` and palette handler tests.

## Acceptance criteria

- Palette invokes at least one non-navigation action on findings and on draft workspace.
- Alt+1–3 / existing next-finding chords still work; input guard unchanged.
- Working mode does not pop teaching overlay on first visit.
- No desktop **More** menu for review tabs.

## Constraints

- Do not add a new shortcut library.
- Do not use bare letter keys for global actions.
- Do not defer the thin sync listener again (WD-11 owns remaining chrome deferral).
