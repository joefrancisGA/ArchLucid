# LK-02 — Draft editor has a document undo/redo stack

**Do not fork IS-12, CD-10, or FD-11** for Record correction. **Do not fork WA-16 / SD-08** for last-saved. This file is the **product of ADR 0071**: the unsealed architecture draft editor undoes document edits, not only a 300s mutation toast.

## Goal

On Working, the architecture draft editor supports **Undo** and **Redo** (Ctrl+Z / Ctrl+Shift+Z or the platform default, plus palette actions) for the draft document fields that autosave already persists. Stack depth matches ADR 0071. Spawn-locked drafts do not expose undo into the locked document. Guided may ship the same control; do not hide it on Working.

## Why

Autosave without undo trains people to fear the desk. Last-saved tells you the server has a blob; it does not restore the sentence you deleted. Livelihood work is hours in one draft.

## Context

- ADR 0071 (LK-01) — required
- `archlucid-ui/src/hooks/use-architecture-draft-autosave.ts`
- `ArchitectureDraftWorkspace.tsx` / `ArchitectureDraftWorkspaceBody.tsx`
- `architecture-draft-handoff-gate.ts` `handoffEditorLocked`
- Palette save: Ctrl+Shift+S already on workbench — do not fight autosave with a second store
- `KEYBOARD_SHORTCUTS.md` (AD-10: header must match the listener)
- WCAG 2.1.4: no new printable-key-only shortcuts

## What to build

1. Snapshot the draft document (the same shape autosave PUT/PATCH already sends) onto a bounded stack **after** a successful user edit, coalescing keystrokes (idle window ~500ms or existing debounce — do not snapshot every character).
2. Undo restores the previous snapshot and marks dirty so autosave persists. Redo inverse. Disable when empty.
3. Palette + documented shortcuts. Do not bind bare `Z`.
4. Spawn-locked / `editorLocked`: no undo of the locked form; LK-04 may replace the form entirely.
5. Vitest: type → undo restores prior title/intent; redo restores; locked fixture has no enabled undo into fields. No `window.confirm` as the only undo.

## Acceptance criteria

- A Working architect can undo a paragraph in the draft ten minutes later without Record correction.
- Autosave last-saved still updates after undo persists.
- Sealed review records are untouched.
- `MUTATION_UNDO_WINDOW_SECONDS` remains 300.

## Constraints

- Do not invent a draft-diff engine (R12 leftover is LS-06).
- Do not persist undo history as a second aggregate unless the ADR chose server snapshots — follow 0071.
- One class per file if C# is required; prefer client stack if 0071 chose in-session + autosave.
