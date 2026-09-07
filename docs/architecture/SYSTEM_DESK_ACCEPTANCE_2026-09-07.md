# System desk acceptance — wave SY (2026-09-07)

> **Status:** Shipped (SY-100 close audit).  
> **ADR:** [0079 — Working desk is the work surface](./adrs/0079-working-desk-is-the-work-surface.md) (Proposed) · [0077 — Working architecture is the locator](./adrs/0077-working-architecture-is-the-locator.md) (Accepted)

## Wave intent

Monday morning on the architecture desk is a **durable architecture identity**, not a job list. Working mode nests review jobs and desk tools under `/architecture/architectures/{id}`, remaps Alt+R to the portfolio or desk, and ratchets peer `reviewDetailPath` mints with Vitest guards.

## Ratchet

`archlucid-ui/src/lib/system-desk-acceptance-guard.test.ts` (SY-80) extends AO-50 with desk-tool, Alt+R, and Start-route invariants. CI fails if Working muscle memory reopens the reviews inbox or bare peer Insights as Home.

## Evidence table

| Check | Prompt | Evidence |
|-------|--------|----------|
| Working Start / Alt+N not peer review or reviews hub | SY-16 / SY-80 | `working-start-route.test.ts`, `system-desk-acceptance-guard.test.ts` |
| Working Alt+R → desk or portfolio | SY-07 | `resolve-working-alt-r-href.test.ts` |
| Alt+C/A/Y/G → nested desk tools | SY-08–11 | `resolve-working-desk-tool-href.test.ts` |
| Nested Ask / Compare / Graph / Findings routes | SY-36–41 | `architecture-routes.test.ts`, peer redirect tests |
| Working nav / sidebar inbox label | SY-56 | `operator-nav-labels.test.ts` |
| Architectures hub breadcrumb parent | SY-32 | `architectures-hub-copy.test.ts` |
| First-review guide nested hrefs | SY-18 | `first-review-guide-status.test.ts` |
| Share / room / pin / invite nested hrefs | SY-20–24 | `working-share-href.test.ts`, invite/review-url tests |
| Provenance / dual-pane / audit nested fallbacks | SY-26–28 | `working-back-href.test.ts`, `resolve-audit-trail-review-href.test.ts` |
| Evidence parent builders (ask/graph/governance) | SY-31 | `system-desk-evidence-copy-parent.test.ts` |
| Unfinished-work href resolver | SY-54 | `reviews-hub-unfinished-work-href.test.ts` |
| Reviews hub orientation sources | SY-55 | `reviews-hub-evidence-copy.test.ts` |
| Continue-last-review nested target | SY-64 | `resolve-continue-last-review-package.test.ts` |
| Pilot scorecard finalized href | SY-70 | `pilot-scorecard-present.test.ts` |
| Contextual help Inbox label | SY-71 | `contextual-help-working-desk-copy-guard.test.ts` |
| `reviewDetailPath` import ratchet on Working desk modules | SY-77 | `working-review-detail-path-import-guard.test.ts` |
| Browser tab title uses architecture display name | SY-61 / SY-85 | `working-architecture-document-title.test.ts` |
| Getting-started Working examples use nested URLs | SY-87 | `getting-started-help-working-examples.test.ts` |
| Sealed records are children, not Working Home | SY-92 | `signed-records-working-desk-guard.test.ts` |
| E2E core path starts at architectures portfolio | SY-98 | `e2e/smoke.spec.ts` (`@smoke-core-path`), `e2e/working-desk-landing.spec.ts`, `working-desk-e2e-landing-guard.test.ts` |
| Contextual help Working href remapping | SY-87 | `contextual-help-working-href-guard.test.ts` |

## Shipped invariants (SY-80 green)

- Working **Start** and **Alt+N** resolve to `/architecture/architectures/{id}` or `/architecture/architectures/new`, never `/architecture/reviews` or a peer review URL.
- Working **Alt+R** opens the architecture portfolio or last-open desk, not the reviews inbox as Home.
- Nested **Ask**, **Compare**, **Graph**, and **Findings** routes exist under `/architecture/architectures/{id}/…`.
- Nested review layouts set `document.title` from the architecture display name (optional ` · Review` / tool suffix).
- Signed-records list rows link to nested review desks when `requestId` is known; Working Start never targets sealed-records.

## Residuals (closed or exempt)

| Item | Status |
|------|--------|
| Guided mode peer `/insights/*` and `/architecture/reviews/{id}` URLs | **Exempt** (SY-06) — intentional Guided behavior |
| Unlinked reviews without `architectureId` | **Honest fallback** — `resolveWorkingRunReviewLocator` keeps peer URL when parent unknown |
| Contextual-help topic hrefs | **Closed** — `resolve-working-contextual-help-entry.ts` + `contextual-help-working-href-guard.test.ts` |
| E2E Working landing | **Closed** — `@smoke-core-path` + `@working-desk-landing`; inbox-specific specs (`demo-readiness`, `pilot-nav-profile`, sponsor redirect) intentionally keep `/architecture/reviews` |
| Insight density / FC / dual skin / what-if / live presence | **Out of scope** — assessment / GTM backlogs |

## Explicitly not in scope

- DeterministicInsightDensityGate demotion predicate changes.
- SOC 2 CPA attestation (TB-135 / G-REAL-05) or third-party pen test (TB-136 / G-ASSURANCE-02).
- GTM cohort programs M-90, M-44, M-91, M-92.
