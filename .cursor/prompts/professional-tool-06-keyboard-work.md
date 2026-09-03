# PT-06 — Keyboard is a work surface, not only navigation

## Goal

A Working-mode architect can drive **work** from the keyboard: shortcuts apply with focus in the header/nav, command palette includes frequent actions (not only routes), and finding/alert triage plus save/undo are documented in Shift+?. Teaching coaches stay off in Working mode.

## Why

`archlucid-ui/docs/KEYBOARD_SHORTCUTS.md` is mostly Alt+letter **route jumps**. The help overlay and `KeyboardShortcutProvider` wrap main content via a **deferred** `AppShellKeyboardShortcutBoundary`; the header/nav sit outside that wrapper, so Alt shortcuts fail until the user tabs into main. Command palette (`Ctrl+K`) is page search. All-day tools (VS Code, Excel, CAD) bind keys to *work*, not only *places*.

## Context

- `archlucid-ui/docs/KEYBOARD_SHORTCUTS.md`
- `archlucid-ui/src/lib/shortcut-registry.ts`
- `archlucid-ui/src/components/KeyboardShortcutProvider.tsx`
- `archlucid-ui/src/components/shell/AppShellKeyboardShortcutBoundary.tsx`
- `archlucid-ui/src/components/CommandPalette.tsx`
- Alerts/findings page shortcuts (`useAlertCardShortcuts`, `useFindingCardShortcuts`)
- PT-05 undo bindings if already landed; otherwise register placeholders that call existing undo/amend when present

## What to build

1. Mount the shortcut listener at **shell** level so header, sidebar, and main share one map. Keep the input guard (`isEditableTarget`) so typing in fields does not fire Alt shortcuts.
2. Command palette: add **actions** for the current surface (e.g. Start review, Save draft if dirty, next/previous finding, disposition commands when Execute+). Reuse existing handlers; do not duplicate API calls.
3. Document new combos in Shift+? and `KEYBOARD_SHORTCUTS.md`. Prefer Alt/Ctrl chords (WCAG 2.1.4 — no bare single-letter shortcuts except existing `/` search).
4. Working mode: do not auto-open shortcut coaches / first-visit help (`FirstVisitHelpAutoOpen`). Shift+? remains available.
5. If PT-05 shipped, bind Ctrl/Cmd+Z to the in-session finding undo when the success callout is active.
6. Integration tests next to `keyboard-shortcuts-*.test.tsx`.

## Acceptance criteria

- Alt+R / Ctrl+K work with focus in the top bar.
- Palette can invoke at least one non-navigation action on findings and on draft workspace.
- Working mode does not pop teaching overlay on first visit.
- No regression of input guard (shortcuts do not type-steal from inputs).

## Constraints

- Do not add a new shortcut library.
- Do not use bare letter keys for global actions.
- Do not collapse tabs to “make shortcuts simpler.”
