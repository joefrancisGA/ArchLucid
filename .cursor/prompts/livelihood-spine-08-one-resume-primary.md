# LS-08 — One resume primary on Working Home

**Do not fork IS-02 or CD-11.** Working Home already has `OperatorHomeContinueLastReviewPackageSection` and architecture drafts have `ArchitectureDraftContinueLastRow`. This file is the leftover: **two filled Resume CTAs** (last draft vs last package) can compete after IS-02 removes the dual-path chooser.

## Goal

Working Home has **one** filled primary derived from workspace state: in-flight review → last-open package → last-open draft → new work (same priority as IS-03). The other objects are text links (Drafts, Packages), not a second `variant="primary"`. Guided may keep teaching cards.

## Why

Casual tools put two doors on first run. A livelihood desk that swapped the chooser for two equally loud Resume buttons did not fix muscle memory.

## Context

- `OperatorHomeContinueLastReviewPackageSection.tsx`
- `ArchitectureDraftContinueLastRow.tsx`
- `OperatorHomeWorkingPrimaryCta.tsx`
- `PilotCommandCenterCard.tsx` resume vs NBA
- `resolveContinueLastReviewPackageTarget` / architecture-draft-continue-last
- IS-03 `resolveWorkingStartHref` — reuse; do not fork a third priority list

## What to build

1. Single Working Home primary using IS-03 priority. If IS-03 has not landed, implement the same order here and share a helper IS-03 can import.
2. Demote the non-chosen resume to `outline` or a text link. Never two `primary` buttons naming draft vs package.
3. Empty Working: one New work into draft editor (IS-03 empty case).
4. Vitest: fixture with both last draft and last package → one primary pointing at the package; draft is secondary; Guided dual-path tests unchanged.

## Acceptance criteria

- A Working screenshot of Home with both a draft and a package cannot be read as two start products.
- Save-and-exit still has a path back (IS-14 drafts nav).
- TB-1539 single-primary-per-hub holds.

## Constraints

- Do not hide drafts from the product.
- Do not auto-switch Guided.
- Do not collapse review-detail tabs.
