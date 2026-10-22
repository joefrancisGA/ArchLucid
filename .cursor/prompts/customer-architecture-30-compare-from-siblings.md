# CA-30 — Compare pre-filled from sibling reviews

**Do not build N-way compare.** **Do not fork** the Compare engine. Hide demo quick-pick on this desk (CA-47 owns the global Working compare page).

## Goal

From the architecture desk, **Compare** pre-fills both sides from **this architecture’s reviews** (still two reviews). If fewer than two reviews, disable with a form-level reason (TB-2005), not a toast.

## Why

R12 what-if is a ceteris-paribus run of the same system. Compare that opens empty inputs is an evaluator tool.

## Context

- `compare-workspace-copy.ts`
- `CompareDemoQuickPick`
- `startReviewFromArchitectureHref` / compare routes
- ADR 0072 / R12

## What to build

1. Desk CTA + query params for base/compare run ids from children.
2. Vitest: two child reviews → both ids present; one review → CTA disabled with inline reason.
3. Do not change Compare math.

## Acceptance criteria

- Working desk does not launch demo compare.
- Guided may keep demo compare on eval routes.

## Constraints

- No live presence of “who is comparing.”
- Do not leave the architecture identity when you can deep-link compare with scoped ids.
