# HCP-05 — Remaining metric strips: scoped drill-through only where the count is a queue

**Do not fork HCP-03/04 or restyle every KPI card in the product.** Home’s contract applies only when a number is a **filterable queue**. This file is the light leftover: policy packs, audit-trail buyer tiles, and standards/rules summary still show bare numbers. Convert only counts that already have (or should have) a list filter.

## Goal

For each remaining strip: if the number drills into a filtered list, show count + noun + scope (or `SelfDescribingMetricCount`) and make the control a link/button that applies that filter. If the number is a snapshot (selected pack name, last activity timestamp, registered pack total with no filter), leave it — add a scope helper only when it removes ambiguity (`workspace` vs `this review`).

## Why

HCP-03/04 cover Reviews hub and Sponsor. Leaving three other strips as naked totals re-creates the Home bug in quieter rooms. A full visual clone of Home KPI cards would be wrong here.

## Context

- `archlucid-ui/src/app/(operator)/governance/policy-packs/_sections/PolicyPacksMetricStrip.tsx` — Registered packs / Effective layers / Selected pack; numbers are mostly snapshot, not queues
- `archlucid-ui/src/app/(operator)/governance/audit/_sections/AuditBuyerHeaderMetrics.tsx` — six tiles, none are links; audit page already has URL-bound event-type chips (`AuditSearchEventTypeChips`, `auditTrailActionHrefFromSearch`)
- `archlucid-ui/src/app/(operator)/governance/standards-and-rules/_sections/StandardsRulesSummaryStrip.tsx` — click already applies filters; missing scope copy (`workspace` / current pack) and not using `SelfDescribingMetricCount`
- `archlucid-ui/src/lib/governance/audit-trail-filters-url.ts` — reuse for audit tile hrefs
- `archlucid-ui/src/components/usability/SelfDescribingMetricCount.tsx`
- Findings queue header is **done** — do not edit it in this prompt

## What to build

### Audit trail buyer tiles (highest value)

1. Event-type totals that match a filter (decisions, evidence changes, approvals, exports) become links using the existing audit filter URL helper. Total events can link to the unfiltered trail (`workspace` scope). Last activity stays a timestamp, not a count link.
2. Use inline self-describing copy (`N decisions · workspace`) or `SelfDescribingMetricCount` if you can add an audit scope kind without breaking `MetricCountScopeKind`. Prefer **not** overloading findings-queue filters. A small `workspace` dimension is enough; do not invent `audit-tab` unless tests need it.
3. Vitest: decisions tile href selects the decisions event filter; last-activity is not a link.

### Standards/rules summary (medium)

1. Keep click-to-filter. Add visible scope (`this workspace` / current pack) so “12 linked findings” cannot be read as the governance findings queue.
2. Linked-findings card may use `governanceRegisterMetricPresentation` **only if** it truly opens `/governance/findings` with the same count. If it only filters the standards table, do **not** reuse findings presentations — that would lie.
3. Vitest: linked-findings click still sets `linkedFindings: "linked"`; label does not say “open findings” unless the href is the findings queue.

### Policy packs strip (lowest)

1. Do **not** turn Selected pack into a fake count. Optional: Registered packs / Effective layers get `workspace` helper text if missing.
2. Only add hrefs if a real filtered list exists (e.g. packs table default view). No dead links.
3. Vitest: strip still renders three cards; no regression on buyer vs operator labels.

## Acceptance criteria

- Audit event totals that correspond to chips are clickable and agree with the chip filter.
- Standards summary still filters in place; copy does not steal findings-queue vocabulary unless it navigates there.
- Policy packs remain a snapshot strip unless a true queue href exists.
- Home / hub / sponsor / findings-queue tests unchanged.

## Constraints

- Do not apply Home four-up KPI cards to these pages.
- Do not add `MetricCountScopeKind` values that duplicate `governance-filter` for non-findings lists without a comment explaining why.
- Do not change help-topic buyer-polish.
- Do not touch leaf Continue-last-viewed rows.
- Do not collapse review-detail tabs.
- Do not implement **M-90**.
