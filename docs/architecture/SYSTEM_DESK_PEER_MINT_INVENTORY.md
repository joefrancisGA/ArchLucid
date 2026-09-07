> **Scope:** Engineering-only inventory of Working peer-review and peer-Insights mints left after AO wave 17. Owner prompts are SY-18–SY-35 and SY-81–SY-89 unless noted.

**Generated:** 2026-09-07 (SY-04). Re-grep before each mint-sweep PR.

## `reviewDetailPath(` — production call sites

| File | Audience | SY owner | Notes |
|------|----------|----------|-------|
| `lib/architecture/architecture-routes.ts` | Shared | — | Canonical legacy peer builder; keep |
| `lib/architecture/architecture-draft-intake-mode.ts` | Working | SY-25 | Intake fallback when architecture unknown |
| `lib/architecture/working-architecture-review-routes.ts` | Working | — | Redirect helper; not a mint |
| `lib/architecture/working-share-href.ts` | Working | SY-20 | Unlinked review fallback |
| `lib/buyer/buyer-safe-review-navigation.ts` | Buyer/Guided | SY-19 | Buyer nav split |
| `lib/first-review-guide-status.ts` | Working | SY-18 | Guide still mints peer URLs |
| `lib/reviews/review-room-elicitation-url.ts` | Working | SY-21 | Room elicitation when architecture missing |
| `lib/reviews/review-pin-run-url.ts` | Working | SY-22 | Pin/compare empty fallback |
| `components/architecture/ArchitectureFindingsDualPane.tsx` | Working | SY-27 | Pathname fallback |
| `components/provenance/use-provenance-page-workspace.ts` | Working | SY-44 | Pathname fallback |
| `app/(operator)/architecture/reviews/new/GuidedIntakeAlreadySubmittedCallout.tsx` | Guided | SY-06 exempt | Guided teaching |
| `app/(operator)/administration/users/_sections/SettingsRolesInvitePanel.tsx` | Shared | SY-23 | Invite return |
| `app/(operator)/administration/users/_sections/InviteReviewerPageView.tsx` | Shared | SY-23 | Invite return |

## `startReviewFromArchitectureHref(` — production call sites

| File | Audience | SY owner | Notes |
|------|----------|----------|-------|
| `lib/architecture/architecture-routes.ts` | Guided/legacy | SY-16 | Peer `/reviews/new`; Working uses nested helper |
| `lib/architecture/architecture-routes.ts` (`startReviewFromDraftContextHref`) | Working | SY-16 | Nested when parent id known; peer for legacy draft-only |

## `REVIEWS_LIST_PATH` as parent or primary CTA

| File | Audience | SY owner | Notes |
|------|----------|----------|-------|
| `lib/architectures-hub-copy.ts` | Working | SY-32 | Breadcrumb parent still reviews hub |
| `lib/help/help-workspace-mode-copy.ts` | Working | SY-71 | Help links “Open packages” |
| `lib/decision-register-empty-teaching.ts` | Working | SY-34 | Empty-state CTA |
| `lib/first-review-guide-status.ts` | Working | SY-18 | — |
| `lib/governance/*-evidence-copy.ts` | Shared | SY-33 | Copy parent breadcrumbs |
| `lib/contextual-help/*.ts` | Working | SY-87 | Help topic hrefs |
| `lib/sidebar-nav-daily-links.ts` | Working | SY-56 | Inbox row (keep; label Inbox) |
| `lib/reviews-hub-unfinished-work-href.ts` | Working | SY-54 | Unfinished work filter |
| `lib/pilot-scorecard-present.ts` | Working | SY-70 | Sponsor scorecard link |
| `components/reviews/ReviewDetailSiblingInFlightQueue.tsx` | Working | SY-64 | Sibling queue link |
| `components/reviews/ReviewArchiveControl.tsx` | Working | SY-92 | Archive return |
| `shortcut-registry.ts` (`alt+r` registry default) | Guided | SY-07 | Working resolver overrides in listener |

## Bare `/insights/*` keyboard and Home targets

| Surface | Path | SY owner | Notes |
|---------|------|----------|-------|
| `shortcut-registry.ts` `alt+c` | `/insights/compare-two-reviews` | SY-08, SY-38 | Working listener scopes run; nested route pending |
| `shortcut-registry.ts` `alt+a` | `/insights/ask-review-questions` | SY-09, SY-36–37 | Nested Ask + peer redirect shipped SY-36–37 |
| `shortcut-registry.ts` `alt+y` | `/insights/evidence-graph` | SY-10, SY-40 | Nested graph pending |
| `resolve-working-insights-nav-href.ts` | Peer bind-by-query | SY-45 | Sidebar still peer until nested routes |

## Guided exemptions (do not sweep)

- `GuidedIntakeAlreadySubmittedCallout.tsx` — peer `reviewDetailPath`
- Guided `alt+n` → `/architecture/reviews/new`
- Demo / trial peer URLs per SY-06

## Next mint-sweep order

1. SY-18 first-review guide
2. SY-20–SY-23 share / room / pin / invite
3. SY-32 architectures hub breadcrumb
4. SY-77 grep ratchet once call sites are converted
