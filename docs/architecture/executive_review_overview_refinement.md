# Sponsor review overview refinement

## Route

- **Primary surface:** `/reviews/[runId]` with default `reviewTab=overview`
- **Showcase sponsor entry:** `getShowcaseExecutiveHref()` → `/reviews/{SHOWCASE_STATIC_DEMO_RUN_ID}`
- **Server shell:** `archlucid-ui/src/app/(operator)/reviews/[runId]/page.tsx` → `RunDetailPageView`

This refinement targets the **Overview** tab of the review-package workspace — the board-ready sponsor summary shown before sponsors drill into findings, evidence, or exports.

## Navigation distinction

| Layer | Responsibility | Implementation |
| --- | --- | --- |
| **Review package workflow** (top step strip) | Finalized deliverable spine for sponsors/auditors: sponsor summary → signed record → evidence trail → governance → audit | Existing `BuyerGoldenJourneyLayerContextStrip` / `BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS` (unchanged) |
| **Review sections** (in-page tabs) | Working review detail: findings, evidence, decisions, package exports, architecture source, activity | `ReviewDetailWorkspace` with primary tabs + **More sections** menu |

`ReviewDetailWorkspaceOrientation` explains the distinction on buyer-polished review pages.

Overflow tabs (**Policies and standards**, **Architecture**, **Activity**) moved into a **More sections** menu so labels are never truncated (the prior truncated **Archi…** tab was **Architecture**).

## Duplicated sections removed

- **Review summary strip** merged into `RunDetailExecutiveSummary` (single authoritative block).
- **Header metrics** (posture, severity, last evaluated) removed from `RunDetailWorkspaceHeader` to avoid repeating the sponsor summary.
- **Overview shortcut cards** (Findings / Evidence / Decisions / Review package with generic **Open**) removed; destinations live in recommended actions and tabs.
- **Duplicate blocking banner** in overview tab removed (page-level `RunDetailWorkspaceBlockingBanner` retained).
- **Duplicate primary Export proof packet** on desktop: inline `ReviewPackagePrimaryAction` is **mobile-only** (`lg:hidden`); desktop uses sticky action bar.
- **Duplicate sample banner:** `DemoDataBadge` suppressed when `OperatorDemoStaticBanner` shows; banner now includes “Sample data — not your tenant.” when `emphasizeSampleData` is set.
- **Page-bottom Bottom-Line Summary** moved into overview tab content.

## Action hierarchy

- **Primary:** `resolveReviewPackagePrimaryAction` (unchanged logic) — e.g. review findings when blockers exist, governance when decision pending, export when finalized and clear.
- **Desktop:** sticky `RunDetailWorkspaceStickyActions` hosts primary CTA + secondary outline actions.
- **Mobile:** same primary CTA below header (`lg:hidden`).
- **Recommended next actions:** state-derived list with specific button labels (`Review findings`, `Assign owners`, `Add evidence`, `Open architecture package`, etc.).

## Architecture summary mapping

- **Architecture** row shown only when `systemName` differs from review title.
- Raw description fallback preview suppressed when structured sections parse successfully (avoids repeating title text as Purpose/Architecture).
- **View submitted architecture** only when `hasSubmittedArchitecture` is true.
- Missing fields omitted or “Not provided” via honest empty state.

## Bottom-line summary treatment

- `deriveExecutiveBottomLineContent` builds a **narrative** when governance decision + rationale and/or blocking findings are present.
- When only `themeSummaries` exist (topic labels), UI shows **Key decision considerations** instead of “Bottom-Line Summary”.

## Sample disclosure treatment

- Demonstration workspace banner remains on buyer-polished demo chrome.
- Sample tenant warning consolidated into that banner for static demo runs.
- `SampleReviewPackageSummary` in Review package tab unchanged (distinct task: sample package CTA).

## Files changed

| File | Change |
| --- | --- |
| `RunDetailPageView.tsx` | Sponsor summary, rail layout, orientation flag, action dedupe, bottom-line in overview |
| `RunDetailWorkspaceChrome.tsx` | Slim header, responsive rail |
| `RunDetailExecutiveSummary.tsx` | **New** consolidated summary |
| `RunDetailOverviewTab.tsx` | Actions-only overview |
| `RunDetailRecommendedActionsPanel.tsx` | Specific action labels |
| `ReviewDetailWorkspace.tsx` | Primary tabs + More menu, orientation |
| `ReviewDetailWorkspaceOrientation.tsx` | **New** nav explanation |
| `review-detail-workspace-tab-groups.ts` | **New** primary/overflow tab groups |
| `run-detail-workspace-derive.ts` | Action labels, evidence gating, bottom-line derive |
| `RunDetailArchitectureSummaryCard.tsx` | Honest architecture mapping |
| `RunDetailArchitectureSummaryRailClient.tsx` | **New** sidebar card |
| `RunDetailExecutiveBottomLine.tsx` | Narrative vs considerations |
| `FirstWeekRouteGuidance.tsx` | Collapsed committed guidance |
| `first-week-route-guidance.ts` | Removed external AI product copy |
| `OperatorDemoStaticBanner.tsx` | Optional sample-data line |
| Tests + this report | Coverage for listed requirements |

## Tests run

```text
pnpm exec vitest run \
  src/components/reviews/ReviewDetailWorkspace.test.tsx \
  src/components/reviews/RunDetailExecutiveSummary.test.tsx \
  src/components/reviews/RunDetailOverviewTab.test.tsx \
  src/components/reviews/RunDetailArchitectureSummaryCard.test.tsx \
  src/lib/runs/run-detail-workspace-derive.test.ts \
  src/components/FirstWeekRouteGuidance.test.tsx \
  src/app/(operator)/reviews/[runId]/_sections/RunDetailPageView.progressive-disclosure.test.ts \
  src/app/(operator)/reviews/[runId]/_sections/ReviewPackageSummaryHeader.test.ts \
  src/app/(operator)/reviews/[runId]/_sections/resolve-review-package-primary-action.test.ts
```

## Test results

**41 / 41 passed** (Vitest, targeted suites listed above).

UI `agent-compile-check.ps1` could not run in this agent environment (`Start-Process` Win32 error). Full-repo `tsc` reports pre-existing errors in unrelated files; no type errors in the sponsor-overview changed paths.

## Unresolved limitations

1. **Export proof packet** primary action still navigates to `#artifacts-exports` — async pending/success/failure feedback for export itself remains on deliverable controls in the Evidence/Review package tabs, not on the header link.
2. **First-screen proof status** (`RunDetailFirstScreenProofStatusClient`) unchanged — pilot-specific fields may still read as internal on some tenants.
3. **Global buyer journey stepper** not modified; distinction is explained in-page only.
4. **Architecture metadata** limited to submitted description parsing — no new backend fields added.

## Permissions and business logic

No changes to review evaluation, finding counts, governance decisions, finalization, export APIs, or global navigation.
