> **Scope:** Internal shrink-only inventory — Working production modules that still mount buyer-polish / eval / first-week / sample chrome. **Do not add rows to `PRODUCTION_DESK_CHROME_EVAL_GRANDFATHERED_PATHS` from this doc.**

> **Spine:** ADR **0080** · Wave **WS-04** · Owner prompts **WS-06–WS-24**

# Working-seat eval / buyer-polish leak inventory

**Last reviewed:** 2026-09-07

This inventory lists **priority** leaks on architecture / review / desk surfaces. Admin settings and help topics remain grandfathered with one-line rationale until a named prompt owns them.

**Leak classes**

| Class | Meaning | Owner prompts |
|-------|---------|---------------|
| **chrome** | Calls `isBuyerPolishedOperatorShellEnv()` without `useProductionEvalChrome` / resolver | WS-06 |
| **buyer-chrome** | Mounts `*BuyerChrome` gated on env-only checks | WS-09 |
| **sample** | Copy or empty states steer to sample workspace on Working | WS-06 / WS-15 |
| **first-week** | First-session babysit copy (`Stay on this page until you finalize`) | WS-10 |
| **fixture** | Working Vitest / Playwright sets buyer-polished true by default | WS-22 |

## Priority — architecture identity desk

| Path | Leak class | Notes | Owner |
|------|------------|-------|-------|
| `app/(operator)/architecture/architectures/_sections/ArchitecturesHubBuyerChrome.tsx` | buyer-chrome | Uses resolver; verify Working never mounts (SY ratchet exists) | WS-09 |
| `app/(operator)/architecture/architectures/_sections/ArchitectureDraftDetailBuyerChrome.tsx` | buyer-chrome | Resolver-gated detail strip | WS-09 |
| `app/(operator)/architecture/architectures/new/_sections/ArchitecturesNewBuyerChrome.tsx` | buyer-chrome | Resolver-gated new draft teaching | WS-09 |
| `app/(operator)/architecture/architectures/new/_sections/ArchitecturesNewPageSubtitle.tsx` | chrome | Grandfathered `isBuyerPolishedOperatorShellEnv()` subtitle soften | WS-06 |
| `components/architecture/ArchitectureCreatedOverviewBuyerChrome.tsx` | buyer-chrome | **Env-only gate** — ignores workspace mode | WS-09 |
| `components/architecture/ArchitectureCreatedFindingsBuyerChrome.tsx` | buyer-chrome | Env-only gate | WS-09 |
| `components/architecture/ArchitectureCreatedEvidenceBuyerChrome.tsx` | buyer-chrome | Env-only gate | WS-09 |
| `components/architecture/use-architecture-draft-list.ts` | chrome | Grandfathered buyer-polish branches | WS-06 |

## Priority — review detail / findings

| Path | Leak class | Notes | Owner |
|------|------------|-------|-------|
| `app/(operator)/architecture/reviews/[reviewId]/_sections/load-run-detail-deferred-model.ts` | chrome | Grandfathered eval branches on deferred load | WS-06 |
| `app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailFirstWeekRouteGuidanceMount.tsx` | first-week | Mounts first-week guidance on review detail | WS-10 |
| `components/runs/RunDetailPageHeader.tsx` | chrome | Grandfathered buyer-polish copy density | WS-06 |
| `components/runs/RunDetailSectionNav.tsx` | chrome | Shortcut / section nav soften | WS-21 |
| `components/runs/RunExplanationConfidenceBanner.tsx` | chrome | Eval-style confidence soften | WS-06 |
| `app/(operator)/architecture/reviews/[reviewId]/findings/[findingId]/_sections/FindingDetailBuyerChrome.tsx` | buyer-chrome | Finding inspect teaching strip | WS-09 |
| `app/(operator)/architecture/reviews/[reviewId]/findings/[findingId]/FindingInspect*.tsx` (6 files) | chrome | Grandfathered inspect soften | WS-06 |
| `app/(operator)/architecture/architecture-intelligence/_sections/ArchitectureIntelligenceBuyerChrome.tsx` | buyer-chrome | Env-only gate on intelligence hub | WS-09 |

## Priority — sponsor / ROI (career-adjacent)

| Path | Leak class | Notes | Owner |
|------|------------|-------|-------|
| `app/(operator)/architecture/sponsor-dashboard/_sections/SponsorRoiSummarySection.tsx` | chrome / sample | Sample workspace empty-state copy | WS-06 |
| `app/(operator)/architecture/sponsor-dashboard/_sections/SponsorRoiDashboardPageView.tsx` | chrome | Grandfathered KPI soften | WS-06 |
| `components/shell/BuyerGoldenJourneyLayerContextStrip.tsx` | buyer-chrome | Golden-journey context on operator shell | WS-09 |

## Priority — nav / shell density

| Path | Leak class | Notes | Owner |
|------|------------|-------|-------|
| `hooks/useOperatorShellNavRows.ts` | chrome | Grandfathered nav row soften | WS-06 |
| `hooks/use-effective-nav-committed-architecture-review.ts` | chrome | Treats buyer-polish env as committed-nav signal | WS-06 |
| `lib/nav-publish-readiness.ts` | chrome | Buyer-polish gates publish readiness hints | WS-06 |

## Grandfathered — admin / help (low priority; shrink when touched)

| Area | Rationale |
|------|-----------|
| `app/(operator)/administration/**` | Settings surfaces; eval soften acceptable until admin-specific prompt |
| `app/(operator)/help/**` | Teaching docs; Guided-aligned copy |
| `app/(operator)/governance/**` (non-review) | Ops hubs; not Monday-morning desk |
| `app/(operator)/integrations/**` | Connection wizards; onboarding-adjacent |

## Shrink rules

1. **Do not grow** `PRODUCTION_DESK_CHROME_EVAL_GRANDFATHERED_PATHS` — migrate to `useProductionEvalChrome` and remove the row (WS-08).
2. **Priority** fixes target architecture / review / desk rows above before admin/help churn.
3. **`/al-ui-rate`** must not add buyer-walkthrough remediations onto Working production modules (WS-07).
4. Ratchet: `production-desk-chrome-eval-guard.test.ts` (WS-08 shrink) + `working-seat-eval-leak-inventory.test.ts` reference this file.

### Admin exception (grandfather growth only)

Architecture / review paths are **never** eligible. For a new **admin / help / governance** row that still needs temporary grandfather:

1. Add a row to **Grandfathered — admin / help** above with rationale and owner prompt.
2. Append the path to `PRODUCTION_DESK_CHROME_EVAL_GRANDFATHER_DOCUMENTED_EXCEPTIONS` in `production-desk-chrome-eval-inventory.ts`.
3. Do **not** bump `PRODUCTION_DESK_CHROME_EVAL_GRANDFATHER_COUNT_BASELINE` — documented exceptions extend the allowed max by their count only.

Prefer migration to `useProductionEvalChrome` over documenting an exception.
