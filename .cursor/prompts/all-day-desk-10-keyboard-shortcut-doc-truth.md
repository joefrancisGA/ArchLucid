# AD-10 — Keyboard shortcut documentation matches the production listener

**Do not fork PT-09 or LD-08.** Navigation shortcuts already mount via `AppShellSyncKeyboardShortcutListener` → `useShortcutNavigation` → `useKeyboardShortcuts` (window listener). Palette first-keydown is LD-08. This file is the leftover **doc lie**: `archlucid-ui/docs/KEYBOARD_SHORTCUTS.md` still says the header/nav sit outside `KeyboardShortcutProvider`, so operators are told to Tab into main before Alt chords.

## Goal

Update `KEYBOARD_SHORTCUTS.md` (and any Shift+? copy that repeats the old rule) to match production: global Alt navigation is registered on `window` from the sync listener in `AppShellClient`. Note remaining truth: **input guard** still skips chords in fields; page-specific Alerts/Findings still need card focus; **Shift+?** help overlay may still be deferred. If a real header-focus skip still exists, fix the listener — do not document a workaround for a bug you can close in the same session.

## Why

Professionals learn shortcuts from Shift+? and the doc. Stale “focus the page body first” trains extra keystrokes all day. If the code already works from the header, the doc is the defect. If it does not, the listener is the defect.

## Context

- `archlucid-ui/docs/KEYBOARD_SHORTCUTS.md` — “The header/nav sit outside that wrapper”
- `archlucid-ui/src/components/shell/AppShellSyncKeyboardShortcutListener.tsx`
- `archlucid-ui/src/hooks/useShortcutNavigation.ts`
- `archlucid-ui/src/hooks/useKeyboardShortcuts.ts`
- `archlucid-ui/src/integration/keyboard-shortcuts-global.test.tsx`
- Help dialog: `KeyboardShortcutProvider` still deferred for the overlay only

## What to build

1. Read the listener + tests. If Alt+R works without focusing `#main-content`, rewrite the Overview / Discoverability sections.
2. If tests show header focus still swallows chords, fix `useKeyboardShortcuts` target checks (not a second listener). Then document the new truth.
3. Keep WCAG 2.1.4: no bare single-letter shortcuts.
4. Vitest: extend global shortcut tests if you change listener behavior; otherwise a markdown-adjacent comment in the provider is enough — do not add a docs-only snapshot unless the repo already has one.

## Acceptance criteria

- The documented “focus main first” rule is gone **or** it is still true and the listener is fixed.
- Shift+? still lists Alt+letter nav.
- Dev-only Alt+Shift+D remains documented as development-only.

## Constraints

- Do not register shortcuts inside inputs (`isEditableTarget` stays).
- Do not add Cmd+N / browser-chrome conflicts.
- Do not collapse review tabs.
