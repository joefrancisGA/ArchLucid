# CA-34 — Palette: Open architecture uses identity ids

**Do not list destinations Working nav hides.** **Do not fork** command palette work actions except the open target.

## Goal

Ctrl+K **Open architecture** (or equivalent) searches/opens **ArchitectureId** rows from CA-11 list, not draft GUIDs labeled architecture.

1. Draft open stays **Open draft** if present.
2. Working palette does not include demo compare / first-session wizard as the primary architecture action (CA-47).

## Why

Palette is how all-day users jump. Jumping to the wrong object is the same bug as the URL lie.

## Context

- `CommandPalette.tsx`
- `command-palette-handler-actions.ts`
- SD-11 leftover
- CA-11 list

## What to build

1. Palette source + Vitest: identity id in href.
2. Keyboard docs line in `archlucid-ui/docs/KEYBOARD_SHORTCUTS.md` if a new combo is added — prefer reusing Open.

## Acceptance criteria

- Selecting an architecture opens CA-20 identity path.
- Draft fixtures are not shown as architectures.

## Constraints

- No ⌘ glyph in labels (`keyboard-shortcut-display.ts`).
- No More menu.
