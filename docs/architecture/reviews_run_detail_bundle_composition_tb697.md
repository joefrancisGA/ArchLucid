# `/reviews/[runId]` bundle composition investigation (TB-697 / TB-933)

> **Scope:** Contributor investigation artifact; not buyer/operator documentation.  
> **Date:** 2026-07-18 (TB-697); **Updated:** 2026-08-08 (**TB-2117** workspace/overview chrome deferrals); prior 2026-08-03 (**TB-2021** findings/export/below-fold deferrals); prior 2026-07-24 (**TB-933**).
> **Method:** Cross-reference committed First Load JS baseline + static import/deferred-chunk inventory on `RunDetailPageView` (post-**TB-697** / **TB-933** / **TB-2021** deferred-chunk work).
> **Blocked locally (2026-07-18):** `npm run build` / `npm run build:analyze` did not complete in that pass — prefer CI/Linux for analyzer HTML; refresh First Load JS baseline after measured cuts via `npm run write:first-load-js-baseline`.

## Sponsor summary

`/reviews/[runId]` remains the **largest tracked operator route** (baseline **2,255.2 kB** First Load JS in `performance/first-load-js-baseline.v1.json` as of the last committed refresh — **not yet remeasured** after **TB-2021**). **TB-697** moved forensics/architecture/progress modules behind `run-detail-page-view-deferred-chunks.tsx`. **TB-933** (2026-07-24) deferred outcome cards / usability banners / forensics. **TB-2021** (2026-08-03) deferred findings/QuickDecision client leaves, artifacts/exports, and below-fold habit/authority/grounding islands.

What remains sync for buyer first paint: `ReviewDetailWorkspace`, overview/sponsor-summary chrome, and workspace header/summary strips. Further wins need measured `build:analyze` before deferring that chrome.

## Baseline cross-reference

| Source | `/reviews/[runId]` First Load JS | Notes |
| --- | ---: | --- |
| `ui_dependency_assessment.md` (2026-07-12) | 2,150.9 kB | Pre-RC11 assessment snapshot |
| `performance/first-load-js-baseline.v1.json` (2026-07-15) | **2,211.1 kB** | RC11 after OpenAPI/api-types regen; CI #2632 |
| `scripts/fixtures/route-bundle-stats.next16.v1.json` | 2,010.4 kB | Fixture only — illustrative Next 16 shape |

The +60 kB assessment→baseline delta aligns with api-types/OpenAPI expansion called out in baseline `notes`, not necessarily new run-detail UI code.

## Deferred inventory (shipped — TB-697 + TB-933 + TB-2021)

These modules are **not** in the `RunDetailPageView` static import graph (enforced by `run-detail-bundle-deferred-imports.test.ts`):

| Deferred export | Underlying module | Wave |
| --- | --- | --- |
| `RunDetailArchitectureCreatedWorkspaceDeferred` | `ArchitectureCreatedWorkspace` | TB-697 |
| `RunDetailProgressTrackerDeferred` | `RunProgressTracker` | TB-697 |
| `RunDetailTrustEvidenceCardSectionDeferred` | `RunTrustEvidenceCardSection` | TB-697 |
| `RunDetailEstimatedLlmCostCardDeferred` | `RunEstimatedLlmCostCard` | TB-697 |
| `RunDetailAgentResultsSummaryCardDeferred` | `RunAgentResultsSummaryCard` | TB-697 |
| `RunDetailReviewAgentExecutionLogSectionDeferred` | `ReviewAgentExecutionLogSection` | TB-697 |
| `RunDetailRetrievalGroundingSummaryCardDeferred` | `RunRetrievalGroundingSummaryCard` | TB-697 |
| `RunDetailHolisticCriticPanelDeferred` | `RunDetailHolisticCriticPanel` | TB-697 |
| `RunDetailGovernanceAlertsDeferred` | `RunDetailGovernanceAlerts` | TB-697 |
| `RunDetailTechnologyBaselineSection` | `TechnologyBaselineSection` | TB-697 |
| `RunDetailOutcomeCardsDeferred` | `RunDetailOutcomeCards` | TB-933 |
| `RunDetailWhatIfBranchCompareBannerDeferred` | `WhatIfBranchCompareBanner` | TB-933 |
| `RunDetailCommitBlockingFindingsBannerDeferred` | `CommitBlockingFindingsBanner` | TB-933 |
| `RunDetailStalledReviewGuidanceCalloutDeferred` | `StalledReviewGuidanceCallout` | TB-933 |
| `RunDetailCtoDemoReviewRouteGuardDeferred` | `CtoDemoReviewRouteGuard` | TB-933 |
| `RunDetailPolicyPackImpactCalloutDeferred` | `ReviewDetailPolicyPackImpactCallout` | TB-933 |
| `RunDetailOperatorTechnicalForensicsPanelDeferred` | `RunDetailOperatorTechnicalForensicsPanel` | TB-933 |
| `RunDetailArtifactsExportsSectionDeferred` | `RunDetailArtifactsExportsSection` | TB-2021 |
| Findings / what-if / explanation / explainability table | `dynamic()` inside `RunDetailRunExplanationCollapsible` | TB-2021 |
| Habit loop / recurrence / authority / grounding | `dynamic()` inside `RunDetailBelowFoldSections` | TB-2021 |
| `RunDetailBuyerModeFallbackBannerDeferred` | `RunDetailBuyerModeFallbackBanner` | TB-2117 |
| `RunDetailWorkspaceHeaderDeferred` / summary strip / blocking banner / sticky actions | `RunDetailWorkspaceChrome` | TB-2117 |
| `RunDetailSectionNavDeferred` | `RunDetailSectionNav` | TB-2117 |
| `RunDetailExecutiveBottomLineDeferred` / `RunDetailExecutiveSummaryCtaCardDeferred` | sponsor overview chrome | TB-2117 |
| `RunDetailManifestSummarySectionDeferred` / submitted architecture / capture evidence / governance decision / review package | tab-gated sections | TB-2117 |
| `RunDetailWorkspaceLayout` + `RunDetailWorkspaceDisclosureProvider` | `RunDetailWorkspaceShell.tsx` (sync layout only) | TB-2117 |

Below-fold route sections also dynamic-load `BeforeAfterDeltaPanel` and `RunDetailArchitectureGraphSection` (`RunDetailBelowFoldSections.tsx`).

### TB-2021 measured kB note

| | `/reviews/[runId]` First Load JS |
| --- | ---: |
| Before (committed baseline) | **2,255.2 kB** |
| After TB-2021 deferrals | Pending CI `write:first-load-js-baseline` — do not edit baseline until measured |

Heavy libraries (`reactflow`, `mermaid`, `recharts`) stay off hot paths via existing import-policy tests (**TB-862**, **TB-863**, **TB-570**).

## Top first-paint contributors (static import graph — inferred)

Ranked by **bundle-risk** (module size/transitive deps × first-paint necessity), not measured webpack weights:

| Rank | Module / cluster | First-paint? | Dynamic precedent on this route? |
| --- | --- | --- | --- |
| 1 | `ReviewDetailWorkspace` + tab chrome | Yes | **Deferred** — `ReviewDetailWorkspaceDeferred` (TB-2021); tab panel sections deferred TB-2117 |
| 2 | `RunDetailOverviewPanelClient` | Yes | **Deferred** — `RunDetailOverviewPanelClientDeferred` (TB-2021) |
| 3 | `RunDetailWorkspaceChrome` (`Header`, `SummaryStrip`, …) | Yes | **Deferred** — TB-2117; layout stays in `RunDetailWorkspaceShell` |
| 4 | `RunDetailOutcomeCards` + sponsor summary stack | Yes | Outcome cards deferred TB-933; bottom line / CTA deferred TB-2117 |
| 5 | `RunDetailSectionNav` + in-page section components | Often below-fold / tab-gated | **Deferred** — TB-2117 import-policy guards |
| 6 | Usability/demo banner cluster (`CommitBlockingFindingsBanner`, `StalledReviewGuidanceCallout`, `OperatorDemoStaticBanner`, …) | Often | **TB-696** defers similar chrome in `AppShell` — not yet here |
| 7 | `ArchitectureCreateWorkItemSection` | Tab-gated | **Yes** — `RunDetailArchitectureCreateWorkItemSectionDeferred` (2026-07-18) |
| 8 | `ArchitectureSponsorSharingPanel` | Tab-gated | **Yes** — `RunDetailArchitectureSponsorSharingPanelDeferred` (2026-07-18) |
| 9 | `CtoDemoReviewRouteGuard` | Demo paths only | Could follow demo-gating lazy pattern |
| 10 | `ReviewDetailPolicyPackImpactCallout` | Conditional | Policy packs route uses TB-698 authoring deferrals — callout is sync |

## Prompt 6 checklist

### (a) Top modules in route chunk

**Not machine-ranked** — analyzer HTML unavailable this pass. Use the static-import table above for prioritization; re-run `npm run build:analyze` on Linux CI or a clean tree and attach webpack treemap for byte-accurate ordering.

### (b) Already behind `dynamic()` elsewhere but sync on run detail

| Candidate | Precedent |
| --- | --- |
| Demo/marketing banners | **TB-696** `AppShellIdleOverlays` idle deferral |
| Authoring-heavy modals/dialogs | Same-file deferred exports (`RunDetailExportDeliverableDialog`, `RunDetailGenerateAdrFromRunModal`) |
| Architecture panels | `RunDetailArchitectureCreatedWorkspaceDeferred` (workspace deferred; create-work-item + sponsor sharing still sync) |
| Graph surfaces | `RunDetailArchitectureGraphSection` dynamic in below-fold; overview may still pull graph-adjacent types |

### (c) No existing dynamic-import precedent (new pattern needed)

| Candidate | Notes |
| --- | --- |
| `ReviewDetailWorkspace` shell | Large; splitting server vs client boundaries may beat blind `dynamic()` |
| `RunDetailOverviewPanelClient` | High leverage if measurable KB win |
| Sponsor summary / outcome card stack | Buyer first screen — defer only with skeleton parity |
| `ArchitectureCreateWorkItemSection` / `ArchitectureSponsorSharingPanel` | **Best next TB candidates** — tab-gated, mirrors TB-698 policy-pack authoring split |

## Recommended follow-up batches (separate TB rows — not in this investigation)

1. **Defer architecture create-work-item + sponsor sharing panels** — smallest scoped win; tab-gated; mirror `RunDetailArchitectureCreatedWorkspaceDeferred`.
2. **Measure after (1)** — `npm run build && npm run write:first-load-js-baseline` on CI; compare `/reviews/[runId]` KB delta.
3. **Sponsor-summary / overview client split** — only if (1)+(2) insufficient; requires UX skeleton review.

## Commands to reproduce (clean tree)

```powershell
cd archlucid-ui
$env:ARCHLUCID_SKIP_STANDALONE_OUTPUT = '1'
npm run build:analyze
# Open webpack report; cross-check:
npm run check:first-load-js
```

## References

- **TB-697** implementation: `run-detail-page-view-deferred-chunks.tsx`, `run-detail-bundle-deferred-imports.test.ts`
- Baseline: `archlucid-ui/performance/first-load-js-baseline.v1.json`
- Assessment Tier 3: `ui_dependency_assessment.md` §16
