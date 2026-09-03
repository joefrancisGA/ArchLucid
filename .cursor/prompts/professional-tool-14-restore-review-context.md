# PT-14 — Refresh restores selected finding and workbench focus

## Goal

Review-detail deep links restore **tab**, **workbench focus column**, and **selected finding** after refresh or a shared URL. Filters that already live in the query string stay. Do not invent a parallel session blob that fights the URL.

## Why

`reviewTab` is already in the query. Hash scroll exists for some sections. Selected finding, workbench focus column, and “which card is the instrument” reset on reload. All-day tools treat the URL as the document. A professional who F5s mid-triage should land on the same finding with evidence still in context (PT-12), not at Overview.

## Context

- `archlucid-ui/src/lib/review-detail-workspace-tabs.ts` — `REVIEW_DETAIL_TAB_PARAM`
- `archlucid-ui/src/components/reviews/ReviewDetailWorkspace.tsx` — hash scroll, `workbenchFocusColumn`
- Finding deep links: `graph-finding-deep-links.ts`, `data-finding-id`
- `buildReviewDetailTabHref` / `buildReviewWorkspaceTabHref`
- PT-12 shared selection; if PT-12 has not landed, still persist `findingId` in the query and scroll the card into view

## What to build

1. Add query params (names in one module): e.g. `findingId` and `workbenchFocus` (`architecture` | `findings` | `evidence`). Do not use `archTab` (legacy alias already mapped).
2. `buildReviewDetailTabHref` / in-app finding links include `findingId` when known. Browser back preserves them.
3. On load: if `findingId` is present, select/scroll that card after the list mounts; if missing, do not invent a selection.
4. Workbench: `workbenchFocus` updates the focused column without hiding other columns or other tabs.
5. Invalid ids: ignore and stay on the tab; do not 404 the whole review.
6. Vitest: href builders; resolver reads params; invalid finding id does not throw.

## Acceptance criteria

- Copy-paste of the review URL opens the same tab, same focused workbench column, and same finding card (when that finding still exists).
- Back/forward does not drop `findingId`.
- Overview / policies / other tabs still work without those params.
- Desktop tabs remain all visible.

## Constraints

- Do not store PII in the URL beyond ids already used in routes.
- Do not replace `reviewTab`.
- Do not collapse tabs to “simplify” restore.
