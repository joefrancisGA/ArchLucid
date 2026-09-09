> **Scope:** Engineering-only inventory of Working peer-review and peer-Insights mints left after AO wave 17. Owner prompts are SY-18–SY-35 and SY-81–SY-89 unless noted.

**Generated:** 2026-09-07 (SY-04). Re-grep before each mint-sweep PR.

## `reviewDetailPath(` — production call sites

| File | Audience | SY owner | Notes |
|------|----------|----------|-------|
| `lib/architecture/architecture-routes.ts` | Shared | — | Canonical legacy peer builder; keep |
| `lib/architecture/architecture-draft-intake-mode.ts` | Working | SY-25 | **Done** — Guided peer fallback; Working uses nested |
| `lib/architecture/working-architecture-review-routes.ts` | Working | — | Redirect helper; not a mint |
| `lib/architecture/working-share-href.ts` | Working | SY-20 | **Done** — nested primary; peer only when unlinked |
| `lib/buyer/buyer-safe-review-navigation.ts` | Buyer/Guided | SY-19 | Buyer nav split |
| `lib/first-review-guide-status.ts` | Working | SY-18 | **Done** — nested when architecture id known |
| `lib/reviews/review-room-elicitation-url.ts` | Working | SY-21 | **Done** — nested when architecture id known |
| `lib/reviews/review-pin-run-url.ts` | Working | SY-22 | **Done** — nested when architecture id known |
| `components/architecture/ArchitectureFindingsDualPane.tsx` | Working | SY-27 | **Done** — nested pathname fallback |
| `components/provenance/use-provenance-page-workspace.ts` | Working | SY-44 | **Done** — nested pathname fallback (SY-26) |
| `app/(operator)/architecture/reviews/new/GuidedIntakeAlreadySubmittedCallout.tsx` | Guided | SY-25 | **Done** — Working nested; Guided peer |
| `app/(operator)/administration/users/_sections/SettingsRolesInvitePanel.tsx` | Shared | SY-24 | **Done** — nested success link on Working |
| `app/(operator)/administration/users/_sections/InviteReviewerPageView.tsx` | Shared | SY-23 | **Done** — nested back/share on Working |

## `startReviewFromArchitectureHref(` — production call sites

| File | Audience | SY owner | Notes |
|------|----------|----------|-------|
| `lib/architecture/architecture-routes.ts` | Guided/legacy | SY-16 | Peer `/reviews/new`; Working uses nested helper |
| `lib/architecture/architecture-routes.ts` (`startReviewFromDraftContextHref`) | Working | SY-16 | Nested when parent id known; peer for legacy draft-only |

## `REVIEWS_LIST_PATH` as parent or primary CTA

| File | Audience | SY owner | Notes |
|------|----------|----------|-------|
| `lib/architectures-hub-copy.ts` | Working | SY-32 | **Done** — Overview parent, not reviews inbox |
| `lib/help/help-workspace-mode-copy.ts` | Working | SY-71 | **Done** — Inbox label on desk help actions |
| `lib/decision-register-empty-teaching.ts` | Working | SY-34 | **Done** — architectures portfolio CTA |
| `lib/first-review-guide-status.ts` | Working | SY-18 | — |
| `lib/governance/*-evidence-copy.ts` | Shared | SY-31 | **Done** — Working portfolio parent on Ask/graph/findings |
| `lib/reviews-hub-evidence-copy.ts` | Working | SY-55 | **Done** — portfolio parent on Working hub |
| `lib/contextual-help/*.ts` | Working | SY-87 | **Done** — `resolve-working-contextual-help-entry.ts` |
| `lib/sidebar-nav-daily-links.ts` | Working | SY-56 | Inbox row (keep; label Inbox) |
| `lib/reviews-hub-unfinished-work-href.ts` | Working | SY-54 | **Done** — desk or nested job |
| `lib/pilot-scorecard-present.ts` | Working | SY-70 | **Done** — architecture desk primary drill-down |
| `components/reviews/ReviewDetailSiblingInFlightQueue.tsx` | Working | SY-64 | **Done** — architectures empty-state link |
| `components/reviews/ReviewArchiveControl.tsx` | Working | SY-92 | **Done** — archive returns to portfolio |
| `resolve-working-insights-nav-href.ts` | Working | SY-45 | **Done** — sidebar scopes to nested desk tools |

## Bare `/insights/*` keyboard and Home targets

| Surface | Path | SY owner | Notes |
|---------|------|----------|-------|
| `shortcut-registry.ts` `alt+c` | `/insights/compare-two-reviews` | SY-08, SY-38 | **Done** — Working listener + nested compare |
| `shortcut-registry.ts` `alt+a` | `/insights/ask-review-questions` | SY-09, SY-36–37 | **Done** — nested Ask + peer redirect |
| `shortcut-registry.ts` `alt+y` | `/insights/evidence-graph` | SY-10, SY-40 | **Done** — nested graph + peer redirect |
| `shortcut-registry.ts` (`alt+r` registry default) | Guided | SY-07 | Working resolver overrides in listener |

## Remaining honest fallbacks (not mint bugs)

- `reviewDetailPath` when `architectureId` / `requestId` / registry parentage is unknown — unlinked jobs only.
- Guided exemptions below — do not sweep.
- Tenant-wide Insights (`/insights/search-review-evidence`, ROI, sponsor report) — not desk Home targets.

## Guided exemptions (do not sweep)

- `GuidedIntakeAlreadySubmittedCallout.tsx` — peer `reviewDetailPath`
- Guided `alt+n` → `/architecture/reviews/new`
- Demo / trial peer URLs per SY-06

## Mint sweep status

Wave SY engineering mint sweep **complete** (2026-09-07). Re-grep only when new `reviewDetailPath(` call sites land on Working surfaces.
