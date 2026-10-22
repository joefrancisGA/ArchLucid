# CA-36 — Guided keeps draft-inventory teaching

**Do not auto-switch** stored Guided users to Working. **Do not delete** ADR 0067 two-door teaching.

## Goal

After CA-25/32, **Guided / demo / trial** may still list drafts as the teaching inventory and keep Create vs Review doors.

1. Inventory split is **mode-gated**, not deleted.
2. Tests that required two start products on **Working** were already relaxed by CD-03 — do not reintroduce peer-parity on Working.
3. Help topics that say Guided lists drafts are updated to say **Guided**, not “the product.”

## Why

Evaluator sessions still need a first-run story. The livelihood failure is teaching that story on the **paying** desk.

## Context

- ADR 0067
- `useWorkspaceMode` / `useProductionDeskChrome`
- FD-10 Guided opt-in Working invitation — do not auto-switch

## What to build

1. Gate + tests: Guided fixture still sees draft list labels; Working does not.
2. Copy audit of hub subtitle so Guided is explicit.

## Acceptance criteria

- Guided two-door teaching remains legal.
- Working hub does not show those doors as peer products.

## Constraints

- No rewrite of ADR 0067 body.
- No More menu.
