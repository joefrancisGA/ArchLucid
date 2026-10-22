# WA-18 — Finding disposition from the Working list (not inspect-only)

**Do not fork LI-07 or RS-14** for findings next/prev keys or merge-conflict cue on the list. This file is **doing the work on the list**: Working-mode findings table can accept / reject / defer (existing dispositions) from the focused row without opening inspect.

## Goal

A Working-mode architect on review-detail Findings (and the governance queue if the same commands apply) can dispose the focused finding from the keyboard and a row action, with the same undo window and Record correction as inspect. Inspect remains for evidence. TB-2005: disable actions that cannot succeed. Input guard `isEditableTarget` unchanged.

## Why

All-day triage is a list. Casual tools make every decision a detail page. Livelihood tools bind keys to work (PT-06 leftover). LI-07 made next/prev; disposition is still mouse-inspect.

## Context

- `use-review-workbench-shortcuts.ts` / `shortcut-registry.ts`
- Findings table on `RunDetailFindingsWorkspace.tsx`
- Governance findings queue operational actions
- Mutation registry + 300s undo
- RS-14 conflict cue — if conflicted, disposition disabled with recovery, not silent last-write-wins

## What to build

1. Row action + palette/chord for the existing primary dispositions on the focused finding. Document in Shift+? and `KEYBOARD_SHORTCUTS.md`. Prefer Alt/Ctrl (WCAG 2.1.4 — no new bare letter except existing `/`).
2. Conflicted rows (RS-14): no dispose; show recovery.
3. Vitest next to `keyboard-shortcuts-*.test.tsx`: focused row disposes; input guard skips when typing in a note.

## Acceptance criteria

- Working user can clear a queue of obvious dispositions without opening inspect.
- Inspect still exists for evidence/trail.
- Guided may keep inspect-first; Working gets list work.

## Constraints

- Do not add a new shortcut library.
- Do not collapse tabs to “make shortcuts simpler.”
- Do not change `typed-engine-protected`.
