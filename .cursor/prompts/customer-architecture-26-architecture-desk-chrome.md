# CA-26 — Architecture desk chrome

**Do not fork IS-02.** **Do not collapse review tabs.** CA-08 get + CA-20 route must exist.

## Goal

The Monday-morning surface for one identity:

1. Display name + last updated (Carbon density).
2. Honesty line: this is the **architecture**, not a sealed record.
3. Slots (can be stubs with testids if CA-27–31 follow immediately): current draft, child reviews, latest seal, compare, rename.
4. No “Start review” wizard chrome as the page identity. Start review is a **child action**.

## Why

ADR 0069 made start one primary. The rest of the week still dumps the architect into Reviews or a draft form. Collaboration without chat is **shared history on one identity**.

## Context

- `ArchitectureDraftWorkspace.tsx` — must not be the whole page
- `UI_DESIGN_SYSTEM.md` compact spacing
- `OperatorPageHeader`

## What to build

1. Desk page + copy module (sentence case).
2. Vitest: Working fixture renders name from identity GET, not draft title alone.
3. Child tables can be empty placeholders with “Reviews” heading if CA-27 is next.

## Acceptance criteria

- Opening the architecture does not look like Guided intake.
- Desktop review tabs on a child review are unchanged.

## Constraints

- No live presence. No comment threads.
- TB-2005 only if rename is included (prefer CA-31).
