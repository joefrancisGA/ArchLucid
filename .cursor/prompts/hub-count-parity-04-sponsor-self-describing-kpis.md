# HCP-04 — Sponsor dashboard KPIs use the Home metric contract

**Do not fork Home’s workspace-metrics strip or rewrite the sponsor dashboard IA.** Home `#1563` made KPIs `SelfDescribingMetricCount`. Sponsor (`/architecture/sponsor-dashboard`, workbook **ARE**) still uses `Card` + raw `display` numbers with a helper `formatMetricCountScopeLabel` on some tiles only.

## Goal

Primary sponsor count tiles that represent **queues** (findings, stale risks, decisions needed, expiring waivers) render through `SelfDescribingMetricCount` (or the same headline/aria-label contract) with honest hrefs. ROI / savings / freshness tiles that are **not** integer queues stay as today — do not force `MetricCountPresentation` onto dollars or timestamps.

## Why

Home and findings-queue header already tell the architect *what* was counted and *which filter*. Sponsor still shows “12” on a card titled Risk posture, then a separate scope line that is easy to miss. Drill-through hrefs are also looser than Home (`decisionsNeeded` → `/governance/findings` with no filter; Home open findings → `filter=open`).

## Context

- `archlucid-ui/src/app/(operator)/architecture/sponsor-dashboard/_sections/SponsorDashboardPrimaryMetricsSection.tsx` — decisions needed + risk posture + scope helper
- `archlucid-ui/src/app/(operator)/architecture/sponsor-dashboard/_sections/SponsorRoiDashboardLiveKpiCards.tsx` — additional live KPI tiles
- `archlucid-ui/src/lib/sponsor/sponsor-kpi-drill-through-hrefs.ts` — `SPONSOR_KPI_DRILL_THROUGH`
- `archlucid-ui/src/lib/metric-count-presentation.ts` — `workspaceOpenFindingsPresentation`, `governanceRegisterMetricPresentation` (`stale`, `open`, needs-decision if a filter exists)
- `archlucid-ui/src/components/usability/SelfDescribingMetricCount.tsx`
- `archlucid-ui/src/lib/architecture/architecture-risk-register-page.ts` — `RiskRegisterFilter` values (`open`, `stale`, `needs-decision`, `expiring-soon`)
- Findings queue already consumes `governanceRegisterMetricPresentation` — match it
- Do **not** restyle executive dashboard type scale away from `OPERATOR_TYPOGRAPHY.executiveDashboardMetric` if design tokens require it — wrap or extend `SelfDescribingMetricCount` with a `variant` rather than forking markup

## What to build

1. Inventory which sponsor tiles are integer queue counts vs money/freshness. Only queue counts switch to the Home contract.
2. Map each queue tile to a `MetricCountPresentation`:
   - open / newly discovered findings → `workspaceOpenFindingsPresentation` or `filter: "open"`
   - stale architecture risks → `governanceRegisterMetricPresentation` `{ filter: "stale" }`
   - decisions needed → `needs-decision` if that filter is real; otherwise keep copy honest and do not claim a filter the queue does not support
   - expiring waivers → exceptions href already on `SPONSOR_KPI_DRILL_THROUGH.expiringWaivers` — add a presentation or a scoped label `workspace` + noun; do not pretend it is the findings queue
3. Align `SPONSOR_KPI_DRILL_THROUGH` hrefs with those presentations (no unfiltered `/governance/findings` when the tile means open or stale).
4. Keep card titles/descriptions for sponsor vocabulary (`BUYER_SPONSOR_SUMMARY_VOCABULARY`) — the count control inside the card becomes self-describing.
5. Vitest:
   - Stale-risks count link href includes `filter=stale`.
   - Decisions-needed href matches the presentation filter (or a documented non-filter destination if no filter exists — then the noun must not say “open findings”).
   - Money / freshness tiles unchanged.
   - Home and findings-queue tests unchanged.

## Acceptance criteria

- A sponsor screenshot of a findings-count tile reads as `N {noun} · workspace · {filter}`, not a naked number.
- Clicking the count lands on the same filter the label describes.
- ROI currency tiles are not shoehorned into `MetricCountPresentation`.

## Constraints

- Do not copy Home’s four-up metric **card chrome** if sponsor already uses executive `Card` — swap the count control, not the page skeleton.
- Do not change sealed-record / PDF sponsor exports in this prompt unless a count string would otherwise disagree (then share the presentation helper, do not restyle PDF).
- Do not collapse review-detail tabs.
- Do not implement **M-90** or GTM sponsor-pack work.
