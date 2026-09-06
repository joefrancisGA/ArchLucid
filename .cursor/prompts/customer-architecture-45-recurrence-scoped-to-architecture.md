# CA-45 — Recurrence / improve-loop scoped to architecture

**Do not confuse** recurrence rows with identity merge (CA-18). **Do not add a 40th engine.**

## Goal

If recurrence / scheduled re-review already exists (migration 324 and related UI):

1. Schedule hangs off **ArchitectureId**, not a floating run id only.
2. UI copy: recurring review **of this architecture**.
3. Creating a recurrence from a review pre-fills the parent architecture.
4. If recurrence is not customer-visible yet, add the FK/honesty only where the schedule is stored — do not invent a new scheduling product.

## Why

A weekly review of “the last run” is evaluator automation. A weekly review of **the system** is a livelihood instrument.

## Context

- `324_ArchitectureRecurrenceAndImproveLoop.sql`
- Recurrence activation copy
- CA-16 spawn link

## What to build

1. Scope field + copy + tests that a recurrence cannot attach to another tenant’s architecture.
2. If no UI exists, stop at persistence honesty + API field — say so in the PR.

## Acceptance criteria

- A recurrence created from a child review stores the parent ArchitectureId.
- No SystemName fuzzy attach.

## Constraints

- ADR 0037. No merge of draft/review tables.
- Do not implement live presence of schedule owners.
