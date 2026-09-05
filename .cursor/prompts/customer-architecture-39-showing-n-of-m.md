# CA-39 — Showing N of M on architecture and review inventories

**Skip if** DA-07 already shipped the same helper **and** the identities hub uses it. **Do not** silently raise page size without a remaining-count line.

## Goal

Working professional lists cannot imply completeness when they are paged.

1. Shared copy helper: “Showing {loaded} of {total}” (TB-2152).
2. Identities hub (CA-25): default page size **50**; max 200; shout when `total > n`.
3. Child reviews table (CA-27) + reviews hub: same contract. Reviews hub default **50** on Working (20 on Guided only if the shout is present).
4. Do not add infinite scroll as a substitute.

## Why

Walking into an ARB with twenty rows while forty exist is a career defect.

## Context

- DA-07 (do not paste)
- `load-runs-page-model.ts`
- CA-07 `totalCount`

## What to build

1. Helper + wire hub + child table.
2. Vitest: total 47, page 50 → no shout; total 47, page 20 → shout.

## Acceptance criteria

- Working identities hub with 21 architectures cannot look complete on a 20-row page.
- No fake totals. If API lacks `totalCount`, add it (CA-07).

## Constraints

- Do not change ADR export (CA-41).
- Do not implement N-way compare.
