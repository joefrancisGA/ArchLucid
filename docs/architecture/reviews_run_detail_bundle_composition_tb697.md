# `/reviews/[runId]` bundle composition investigation (TB-697 / Prompt 6)

> **Scope:** Contributor investigation artifact; not buyer/operator documentation.  
> **Date:** 2026-07-18  
> **Method:** Cross-reference committed First Load JS baseline + static import/deferred-chunk inventory on `RunDetailPageView` (post-**TB-697** deferred-chunk work).  
> **Blocked locally:** `npm run build` / `npm run build:analyze` did not complete in this pass — `build:docs-pdf` failed on `dotnet` PDF render, and a direct `npx next build` hit a pre-existing dirty-tree error (`@/lib/demo` missing from `load-admin-deployment-status-page-data.ts`). Regenerate analyzer HTML on a clean CI/Linux build when machine-readable module weights are needed.

## Executive summary

`/reviews/[runId]` remains the **largest tracked operator route** at **2,211.1 kB** First Load JS (`performance/first-load-js-baseline.v1.json`, RC11 refresh 2026-07-15). The **TB-697** engineering pass (2026-07-17) already moved the heaviest forensics/architecture/progress modules behind `run-detail-page-view-deferred-chunks.tsx` with `run-detail-bundle-deferred-imports.test.ts` guards.

What remains is a **wide first-paint shell**: `ReviewDetailWorkspace`, overview/executive-summary chrome, governance/outcome cards, usability banners, and two **still-static** architecture panels (`ArchitectureCreateWorkItemSection`, `ArchitectureSponsorSharingPanel`). None of these require replacing frameworks — they are candidates for the same `next/dynamic({ ssr: false })` pattern already proven on this route.

## Baseline cross-reference

| Source | `/reviews/[runId]` First Load JS | Notes |
| --- | ---: | --- |
| `ui_dependency_assessment.md` (2026-07-12) | 2,150.9 kB | Pre-RC11 assessment snapshot |
| `performance/first-load-js-baseline.v1.json` (2026-07-15) | **2,211.1 kB** | RC11 after OpenAPI/api-types regen; CI #2632 |
| `scripts/fixtures/route-bundle-stats.next16.v1.json` | 2,010.4 kB | Fixture only — illustrative Next 16 shape |

The +60 kB assessment→baseline delta aligns with api-types/OpenAPI expansion called out in baseline `notes`, not necessarily new run-detail UI code.

## Deferred inventory (already shipped — TB-697)

These modules are **not** in the `RunDetailPageView` static import graph (enforced by `run-detail-bundle-deferred-imports.test.ts`):

| Deferred export | Underlying module |
| --- | --- |
| `RunDetailArchitectureCreatedWorkspaceDeferred` | `ArchitectureCreatedWorkspace` |
| `RunDetailProgressTrackerDeferred` | `RunProgressTracker` |
| `RunDetailTrustEvidenceCardSectionDeferred` | `RunTrustEvidenceCardSection` |
| `RunDetailEstimatedLlmCostCardDeferred` | `RunEstimatedLlmCostCard` |
| `RunDetailAgentResultsSummaryCardDeferred` | `RunAgentResultsSummaryCard` |
| `RunDetailReviewAgentExecutionLogSectionDeferred` | `ReviewAgentExecutionLogSection` |
| `RunDetailRetrievalGroundingSummaryCardDeferred` | `RunRetrievalGroundingSummaryCard` |
| `RunDetailHolisticCriticPanelDeferred` | `RunDetailHolisticCriticPanel` |
| `RunDetailGovernanceAlertsDeferred` | `RunDetailGovernanceAlerts` |
| `RunDetailTechnologyBaselineSection` | `TechnologyBaselineSection` |
| … | (see `run-detail-page-view-deferred-chunks.tsx`) |

Below-fold route sections also dynamic-load `BeforeAfterDeltaPanel` and `RunDetailArchitectureGraphSection` (`RunDetailBelowFoldSections.tsx`).

Heavy libraries (`reactflow`, `mermaid`, `recharts`) stay off hot paths via existing import-policy tests (**TB-862**, **TB-863**, **TB-570**).

## Top first-paint contributors (static import graph — inferred)

Ranked by **bundle-risk** (module size/transitive deps × first-paint necessity), not measured webpack weights:

| Rank | Module / cluster | First-paint? | Dynamic precedent on this route? |
| --- | --- | --- | --- |
| 1 | `ReviewDetailWorkspace` + tab chrome | Yes | Partial — many tabs defer content, shell is sync |
| 2 | `RunDetailOverviewPanelClient` | Yes | No |
| 3 | `RunDetailWorkspaceChrome` (`Header`, `SummaryStrip`, `Layout`, …) | Yes | No |
| 4 | `RunDetailOutcomeCards` + executive summary stack (`RunDetailExecutiveSummary`, `RunDetailExecutiveBottomLine`, CTAs) | Yes | No |
| 5 | `RunDetailSectionNav` + in-page section components (`RunDetailGovernanceDecisionSection`, `RunDetailReviewPackageSection`, …) | Yes | No |
| 6 | Usability/demo banner cluster (`CommitBlockingFindingsBanner`, `StalledReviewGuidanceCallout`, `OperatorDemoStaticBanner`, …) | Often | **TB-696** defers similar chrome in `AppShell` — not yet here |
| 7 | `ArchitectureCreateWorkItemSection` | Tab-gated | **No** — architecture workspace deferred, create-work-item is not |
| 8 | `ArchitectureSponsorSharingPanel` | Tab-gated | **No** |
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
| Executive summary / outcome card stack | Buyer first screen — defer only with skeleton parity |
| `ArchitectureCreateWorkItemSection` / `ArchitectureSponsorSharingPanel` | **Best next TB candidates** — tab-gated, mirrors TB-698 policy-pack authoring split |

## Recommended follow-up batches (separate TB rows — not in this investigation)

1. **Defer architecture create-work-item + sponsor sharing panels** — smallest scoped win; tab-gated; mirror `RunDetailArchitectureCreatedWorkspaceDeferred`.
2. **Measure after (1)** — `npm run build && npm run write:first-load-js-baseline` on CI; compare `/reviews/[runId]` KB delta.
3. **Executive-summary / overview client split** — only if (1)+(2) insufficient; requires UX skeleton review.

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
