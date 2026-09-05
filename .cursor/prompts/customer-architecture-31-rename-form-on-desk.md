# CA-31 — Rename form on the architecture desk

**Do not toast** empty-name validation. CA-10 / CA-12 must exist.

## Goal

Desk can rename the identity:

1. Disable primary save until name is non-empty (TB-2005).
2. Inline field error; `showError` only for network/409.
3. Sentence case. `w-fit` CTA.
4. Does not rewrite draft document title (CA-15 policy).

## Why

Application PATCH without a desk control leaves the name as a support-only field. Meetings change names.

## Context

- CA-10 / CA-12
- `UI_DESIGN_SYSTEM.md` form validation
- CA-26 chrome

## What to build

1. Small form section + Vitest (disabled when empty; Working fixture).
2. Guided may hide rename if teaching uses draft title only — document it.

## Acceptance criteria

- Empty name cannot submit.
- Success updates the H1 without a full wizard reload if cheap.

## Constraints

- No ghost/link Button.
- No per-architecture ACL.
