> **Scope:** Contributor-reference — wave-122 robustness controls for architecture create and review (branch `cursor/wave122-robustness-e14f`).

# Architecture create/review robustness — wave 122

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE121.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE121.md) (1437–1448 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 1449 | Review-trail export GET runtime **409** mapper | `AuthorityReadsController.cs` — `GetReviewTrailExport` |
| 1450 | Governance approval requests GET runtime **409** mapper | `GovernanceController.PromotionsActivations.cs` — `GetApprovalRequests` |
| 1451 | Governance promotions GET runtime **409** mapper | same file — `GetPromotions` |
| 1452 | Governance activations GET runtime **409** mapper | same file — `GetActivations` |
| 1453 | Governance approval lineage GET runtime **409** mapper | `GovernanceController.Insights.cs` — `GetApprovalRequestLineage` |
| 1454 | Governance approval rationale GET runtime **409** mapper | same file — `GetApprovalRequestRationale` |
| 1455 | Governance sealed guard runtime **409** mapper | `GovernanceController.SealedManifestGuard.cs` — `EnsureSealedManifestReadAllowedAsync` |
| 1456 | Product run-query sealed guard runtime **409** mapper | `RunQueryController.SealedManifestGuard.cs` — `EnsureSealedManifestReadAllowedAsync` |
| 1457 | Governance workflow approvals/promotions GET `blockedReason` | `governance-workflow-run-read-blocked-reason.ts`, `governance-workflow-api-approvals.ts` — `listApprovalRequests`, `listPromotions` |
| 1458 | Governance approval lineage/rationale GET `blockedReason` | `governance-approval-lineage-blocked-reason.ts`, `governance-workflow-api-approvals.ts` — `getApprovalRequestLineage`, `getGovernanceApprovalRationale` |
| 1459 | Governance activations + coordinator provenance GET `blockedReason` | `governance-workflow-read-blocked-reason.ts`, `governance-workflow-api-environments.ts` — `listActivations`; `run-provenance-blocked-reason.ts`, `architecture-runs-read-detail-artifacts.ts` — `getArchitectureRunProvenance` |
| 1460 | Governance workflow + traceability export fail-closed UX | `GovernanceWorkflowRunListsBlockedCallout.tsx`, `RunDetailRunActionsSection.tsx`, `architecture/reviews/[reviewId]/provenance/page.tsx` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave122ArchitectureTests.cs`.

**Hasher baseline note:** wave 122 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** wave 55 export compare replay and assigned-to-me count follow-ups — see [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE123.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE123.md) (1461–1472) when opened.
