# HCP-03 — Reviews hub counting contract and self-describing summary

**Do not fork Home’s metrics strip layout.** Home already has `deriveOperatorHomeTenantCountingSnapshot` and `SelfDescribingMetricCount`. This file is the leftover on **`/architecture/reviews`**: `deriveReviewsWorkspaceSummary` can mix showcase spine counts into live totals, and `ReviewsHubSummaryRow` shows `N in progress` without a scope label (`workspace · active`).

## Goal

Hub summary metrics use the same presentation contract as Home: **count + noun + scope + href**. Live tenant totals exclude showcase/demo rows (or label them sample). Findings vs open-risks hrefs must not silently disagree (today findings → unfiltered queue, open risks → `filter=open`).

## Why

Home `#1550` / `#1563` made KPI disagreement a ship-blocker. The hub still has a parallel `ReviewsWorkspaceSummary` that can count showcase `SHOWCASE_STATIC_DEMO_SPINE_COUNTS` into “findings” / “open risks” while inventory filters count real rows. A Working architect cannot tell whether “12 findings” is this workspace or the sample package.

## Context

- `archlucid-ui/src/app/(operator)/architecture/reviews/_sections/reviews-workspace-summary.ts` — `runFindingCount` / `runRiskCount` fall back to showcase spine counts
- `archlucid-ui/src/app/(operator)/architecture/reviews/_sections/ReviewsHubSummaryRow.tsx` — custom `SummaryMetric` (number + label + href), not `SelfDescribingMetricCount`
- `archlucid-ui/src/app/(operator)/architecture/reviews/_sections/reviews-hub-summary-destinations.ts` — `REVIEWS_HUB_SUMMARY_FINDINGS_HREF` is unfiltered `buildGovernanceFindingsQueueHref()`; open risks uses `OPERATOR_HOME_OPEN_FINDINGS_HREF` (`filter=open`)
- `archlucid-ui/src/lib/metric-count-presentation.ts` — `operatorHomeActiveReviewsPresentation`, `operatorHomeFinalizedPackagesPresentation`, `workspaceOpenFindingsPresentation`, `formatMetricCountHeadline`
- `archlucid-ui/src/components/usability/SelfDescribingMetricCount.tsx` — `variant="inline"` fits a summary row
- `archlucid-ui/src/lib/demo-run-canonical.ts` / `filterTenantOverviewRuns` — reuse Home’s tenant filter if it already excludes showcase
- `archlucid-ui/src/lib/operator/operator-home-tenant-counting.ts` — prefer importing/filtering rather than a third snapshot type unless hub preview vs full inventory needs it

## What to build

1. Tenant filter for hub summary: live counts from non-showcase runs. Showcase may keep labeled sample counts in Guided/demo empty teaching only — not in the live summary row.
2. Replace (or wrap) `SummaryMetric` with `SelfDescribingMetricCount` `variant="inline"` using existing presentations:
   - in progress → `operatorHomeActiveReviewsPresentation` (href already `reviewsHubInventoryFilterHref("Active")`)
   - committed → `operatorHomeFinalizedPackagesPresentation`
   - findings / open risks → `workspaceOpenFindingsPresentation` or `governanceRegisterMetricPresentation` with the **same** filter the href applies
3. Align findings vs open-risks: either one metric, or two metrics with distinct filters (`open` vs `stale` / warnings) and matching hrefs. Do not keep two labels that drill to different queues for the same underlying count.
4. Hide zero-pressure metrics the way the row already skips committed/findings/risks at 0. Do not show `0 active reviews · workspace · active` as work waiting.
5. Vitest:
   - Fixture with showcase run + one live in-progress run → summary in-progress is 1, not 2; findings do not include spine fallback for the showcase row.
   - Headline / aria-label includes scope (`workspace · active`, `workspace · open`).
   - Href for open findings includes `filter=open` (or the chosen filter) and matches the presentation.
   - `reviews-workspace-summary.test.ts` updated; Home counting tests unchanged.

## Acceptance criteria

- Hub summary cannot disagree with inventory filter chips for the same tenant.
- Sample package does not inflate Working live totals.
- Metrics are clickable and self-describing (count, noun, scope).

## Constraints

- Do not copy Home’s four KPI **cards** onto the hub — keep the compact summary row.
- Do not change AD-07 columns.
- Do not add a second scope vocabulary (`tenant` vs `workspace`) — use `MetricCountScopeKind`.
- Do not implement **M-90**.
