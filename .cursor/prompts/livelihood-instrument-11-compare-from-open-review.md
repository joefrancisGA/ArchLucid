# LI-11 — Compare starts from this review, not an empty picker

**Do not fork PT-20.** Reuse the existing Compare page and query params. Do not build a draft-diff engine or a second pipeline.

## Goal

From review-detail (workbench or Finalized review record), **Compare** opens with the current review as the base side already selected. The architect picks only the other sealed package. Command palette on a review includes “Compare this review.”

## Why

Leaving the review to re-identify the package is casual-site navigation. `Alt+C` goes to `/insights/compare-two-reviews` with empty inputs. Command palette review actions are href-only. The livelihood win is **zero re-entry** on the base package so envelope conversations start in one click. A cheap ceteris-paribus *execute* is out of scope (billable full pipeline).

## Context

- `archlucid-ui/src/lib/compare-two-reviews-route.ts`
- Compare page existing `runId` / base / against query params — do not invent a parallel schema
- `archlucid-ui/src/lib/command-palette-review-actions.ts`
- `SHORTCUTS` `alt+c`
- Compare requires two committed manifests — keep that gate

## What to build

1. `buildCompareTwoReviewsHref({ baseRunId })` (or extend the existing builder) used by review-detail header, workbench, palette review actions, and Working-mode Alt+C **when** the current route is a review-detail.
2. Compare page hydrates the base picker from the query; against stays empty until chosen.
3. If the current review cannot be compared (no sealed record): CTA still goes to Compare with a one-line honesty reason already used on that page — do not spawn a run.
4. Global Alt+C from non-review routes stays the empty Compare page.
5. Vitest: href includes the current id; compare page reads it; in-flight review does not fake a sealed side.

## Acceptance criteria

- Working user on a sealed review: Compare opens with that review as base.
- Palette “Compare this review” is a pre-filled href, not a new API.
- No new compare engine; no draft-vs-draft diff.
- Alt+C from Overview still opens unscoped Compare.

## Constraints

- Do not implement a ceteris-paribus **execute** (second billable run) in this prompt.
- Do not collapse review tabs to add a Compare tab; link/CTA only.
- Do not change tenant isolation on compare APIs.
