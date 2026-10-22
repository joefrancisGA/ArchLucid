# CA-37 — Overview last-open architecture

**Do not fork CD-11** except to prefer architecture identity over review package when both exist.

## Goal

Working Overview / Home continue-last:

1. Prefer last-open **architecture** desk.
2. If an in-flight review exists, keep IS-03 in-flight-first (CA-33).
3. Do not store draft id in a field named `lastOpenArchitectureId`.

## Why

Overview that restores “the last package” trains the run as the object. Monday morning should restore the system.

## Context

- `career-desk-11-overview-last-open-package.md` (do not paste)
- Desk continuity prefs
- `resolve-continue-last-review-package.ts`

## What to build

1. Continuity field + Home card href.
2. Vitest: last architecture id in Working continue control.
3. Guided may keep last review package.

## Acceptance criteria

- Working continue href uses CA-20 identity path.
- In-flight review still wins while running.

## Constraints

- Do not add localStorage as source of truth if server prefs exist (IS-13).
- Do not implement BFF.
