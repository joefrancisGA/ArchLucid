# LI-07 — Keyboard is a work surface, not only a map

**Do not fork PT-06 for shell wrap or first-paint listener placement.** Header/nav already sit inside the shortcut boundary. Palette already has handler actions for save-draft and undo. This file is **findings/alerts work bindings + honest overlay copy**.

## Goal

A Working-mode architect can drive **work** from the keyboard: next/previous finding, disposition (existing Alt+1–3), save draft, undo when the reversible callout is active. Shift+? documents those combos. Teaching coaches stay off in Working. Palette does not lead with setup.

## Why

All-day tools bind keys to *work*, not only *places*. `COMMAND_PALETTE_HANDLER_ACTIONS` covers save-draft (draft routes) and undo (always listed as available). Undo that is “available” on every path including when no reversible mutation exists is a dead row. Findings/alerts triage keys exist (`useFindingCardShortcuts`, `useAlertCardShortcuts`) but Shift+? / `SHORTCUTS` still read like a sitemap, and Alt+N copy still says wizard (LI-06 owns that sentence if both run — do not fight). Guided may keep teaching rows.

## Context

- `archlucid-ui/docs/KEYBOARD_SHORTCUTS.md`
- `archlucid-ui/src/lib/shortcut-registry.ts`
- `archlucid-ui/src/lib/command-palette-handler-actions.ts`
- `archlucid-ui/src/lib/resolve-visible-command-palette-actions.ts`
- `archlucid-ui/src/components/CommandPalette.tsx` / `CommandPaletteActions.tsx`
- `useAlertCardShortcuts`, `useFindingCardShortcuts`, `FindingKeyboardTriageHost`
- `ReversibleMutationSuccessCallout` / `COMMAND_PALETTE_UNDO_MUTATION_EVENT`
- Input guard `isEditableTarget`

## What to build

1. Palette **Undo last reversible change** is available only when a reversible mutation callout is active (or the undo event has a listener that no-ops honestly). Do not show a global dead action on Home.
2. On findings / alerts Execute+ surfaces: palette handler rows for next/previous and existing Alt+1–3 dispositions (reuse functions; do not duplicate API calls).
3. Document new combos in Shift+? and `KEYBOARD_SHORTCUTS.md`. Prefer Alt/Ctrl chords (WCAG 2.1.4 — no new bare single-letter shortcuts except existing `/` search).
4. Working mode: do not auto-open shortcut coaches / first-visit help. Shift+? and F1 remain available.
5. Keep the input guard.
6. Vitest next to `keyboard-shortcuts-*.test.tsx` plus palette handler availability tests.

## Acceptance criteria

- Palette can invoke at least one **non-navigation** action on findings and on draft workspace.
- Undo palette row is not a no-op trap on routes with no reversible mutation.
- Alt+1–3 / Alt+J / Alt+K still work; input guard unchanged.
- Working mode does not pop teaching overlay on first visit.

## Constraints

- Do not add a new shortcut library.
- Do not use bare letter keys for global actions.
- Do not collapse tabs to “make shortcuts simpler.”
- Do not move the shortcut listener out of the shell wrap.
