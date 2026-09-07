# System desk acceptance — wave SY (2026-09-07)

> **Status:** In progress (SY-100 closes this document).  
> **ADR:** [0079 — Working desk is the work surface](./adrs/0079-working-desk-is-the-work-surface.md) (Proposed) · [0077 — Working architecture is the locator](./adrs/0077-working-architecture-is-the-locator.md) (Accepted)

## Ratchet

`archlucid-ui/src/lib/system-desk-acceptance-guard.test.ts` (SY-80) extends AO-50 with desk-tool and Alt+R invariants. CI fails if Working muscle memory reopens the reviews inbox or bare peer Insights as Home.

## Evidence table (partial — updated as batches land)

| Check | Owner | Evidence |
|-------|-------|----------|
| Working Start / Alt+N not peer review or reviews hub | AO-50 / SY-16 | `working-start-route.test.ts`, `system-desk-acceptance-guard.test.ts` |
| Working Alt+R → desk or portfolio | SY-07 | `resolve-working-alt-r-href.test.ts` |
| Alt+C/A/Y/G → nested desk tools | SY-08–11 | `resolve-working-desk-tool-href.test.ts` |
| Nested Ask / Compare / Graph routes | SY-36–41 | `architecture-routes.test.ts`, peer redirect tests |
| Working nav / sidebar inbox label | SY-56 | `operator-nav-labels.test.ts` |
| Architectures hub breadcrumb parent | SY-32 | `architectures-hub-copy.test.ts` |
| First-review guide nested hrefs | SY-18 | `first-review-guide-status.test.ts` |

## Residuals (not wave blockers)

- Guided mode keeps peer `/insights/*` and `/architecture/reviews/{id}` URLs (SY-06 exempt).
- Unlinked reviews without `architectureId` still use peer fallbacks until mint sweep completes.
- Later livelihood issues outside ADR 0079 scope remain on assessment / GTM backlogs.
