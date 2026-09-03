# PT-06 — Keyboard is a work surface, not only navigation

## Goal

A Working-mode architect can drive **work** from the keyboard: command palette invokes frequent **actions** (not only routes), finding/alert triage plus save/undo are documented in Shift+?, and teaching coaches stay off. Header/nav already sit inside the shortcut boundary — do not “fix” that again.

## Why

`archlucid-ui/docs/KEYBOARD_SHORTCUTS.md` and `SHORTCUTS` are still Alt+letter **route jumps**. `CommandPaletteActions` maps “Actions” to `onNavigate(action.href)` (`command-palette-actions.ts` — New review wizard, Finish workspace setup, Open sponsor report). `CommandPaletteReviewActions` is also href-only (compare / replay / sponsor report). Findings/alerts have `Alt+1–3` triage — keep those. All-day tools (VS Code, Excel, CAD) bind keys to *work*, not only *places*.

The shell wrap is already done (`AppShellKeyboardShortcutBoundaryDeferred` wraps header + nav + main in `AppShellClient.tsx`). First-paint deferral is PT-09. This prompt is **action bindings**.

## Context

- `archlucid-ui/docs/KEYBOARD_SHORTCUTS.md`
- `archlucid-ui/src/lib/shortcut-registry.ts`
- `archlucid-ui/src/lib/command-palette-actions.ts`
- `archlucid-ui/src/lib/command-palette-review-actions.ts`
- `archlucid-ui/src/components/CommandPalette.tsx` / `CommandPaletteActions.tsx`
- Alerts/findings page shortcuts (`useAlertCardShortcuts`, `useFindingCardShortcuts`)
- PT-05 amend/undo if already landed; otherwise bind to the existing several-minute finding undo callout

## What to build

1. Command palette: add **handler actions** (not hrefs) for the current surface. Reuse existing functions; do not duplicate API calls.
   - Draft workspace: Save draft if dirty.
   - Findings / alerts (Execute+): next/previous, disposition commands that already exist as Alt+1–3.
   - Undo when `ReversibleMutationSuccessCallout` is active (Ctrl/Cmd+Z or a palette row).
2. Working mode: demote or omit palette rows that teach setup (`Finish workspace setup`, first-review guide). Guided may keep them.
3. Document new combos in Shift+? and `KEYBOARD_SHORTCUTS.md`. Prefer Alt/Ctrl chords (WCAG 2.1.4 — no bare single-letter shortcuts except existing `/` search).
4. Working mode: do not auto-open shortcut coaches / first-visit help (`FirstVisitHelpAutoOpen`). Shift+? remains available.
5. Keep the input guard (`isEditableTarget`).
6. Integration tests next to `keyboard-shortcuts-*.test.tsx` plus palette action tests.

## Acceptance criteria

- Palette can invoke at least one **non-navigation** action on findings and on draft workspace.
- Working palette does not lead with Finish workspace setup.
- Alt+1–3 / Alt+J / Alt+K still work; input guard unchanged.
- Working mode does not pop teaching overlay on first visit.

## Constraints

- Do not add a new shortcut library.
- Do not use bare letter keys for global actions.
- Do not collapse tabs to “make shortcuts simpler.”
- Do not move the shortcut listener out of the shell wrap.
