# Customer-architecture acceptance audit (CA-50)

**Date:** 2026-09-06  
**Wave:** CA-01–CA-50 (customer-visible `dbo.Architectures` identity)  
**Status:** Accepted — no blocking residuals

## Manual checklist

| Check | Result | Evidence |
| --- | --- | --- |
| ADR 0074 exists | Pass | `docs/architecture/adrs/0074-customer-visible-architecture-identity.md` |
| DisplayName + draft FK exist | Pass | Migrations 366–367; `SqlArchitectureIdentityRepository` |
| GET list/get scoped | Pass | `ArchitecturesController`, `ArchitectureIdentityListClient` |
| Working hub lists identities | Pass | `ArchitecturesHubListSection` → `ArchitectureIdentityListClient` in Working mode |
| `{architectureId}` desk ≠ draft editor | Pass | `architecture-routes.ts`, `[architectureId]/page.tsx` resolver |
| Spawn copies ArchitectureId | Pass | `ArchitectureRunBatchCreateOrchestrator` / spawn hooks (CA-16) |
| Showing N of M on Working lists | Pass | `career-export-finding-inventory`, reviews hub inventory bands |
| Career ADR cannot silent-cap | Pass | `GenerateAdrFromRunModal`, `career-export-coverage-honesty` (PC-13) |

## Grep audit (operator UI)

Forbidden patterns from CA-50 — **zero matches** in `archlucid-ui/src` architecture scan roots:

- `architectureId = created.draftId`
- `architectureId: created.draftId`
- `getDraftRequest(architectureId`
- `effectiveArchitectureId`

Enforced by `customer-architecture-acceptance-guard.test.ts`.

## Residual follow-ups

None that block wave close. Larger identity-desk polish remains in normal product backlog — not new overlay waves.
