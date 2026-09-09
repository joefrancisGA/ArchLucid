> **Scope:** Contributor-reference — wave-53 robustness controls for architecture create and review (branch `cursor/wave53-robustness-e14f`).

# Architecture create/review robustness — wave 53

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE52.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE52.md) (609–620 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 621 | Run export history read OpenAPI **409** | `ExportsController.cs`, `ExportsController.SealedManifestGuard.cs` |
| 622 | Architecture request GET OpenAPI **409** | `RunsController.ArchitectureRequests.cs`, `RunsController.SealedManifestGuard.cs` |
| 623 | Authority provenance alias reads OpenAPI **409** | `ProvenanceQueryController.cs`, `ProvenanceQueryController.SealedManifestGuard.cs` |
| 624 | Governance approval/promotion/activation reads OpenAPI **409** | `GovernanceController.PromotionsActivations.cs`, `GovernanceController.SealedManifestGuard.cs` |
| 625 | Finding evidence/inspect/export/traceability reads OpenAPI **409** | `RunQueryController.Findings.cs` |
| 626 | Representative run lookup for request guard | `IRunRepository.TryGetRepresentativeRunIdForArchitectureRequestInScopeAsync` |
| 627 | Pre-finalize checklist sealed read + blocked reason UX | `pre-finalize-checklist.ts`, `pre-finalize-checklist-blocked-reason.ts`, `PreFinalizeChecklistPanel.tsx` |
| 628 | Governance stickiness summary sealed reads | `governance-stickiness-api-registers.ts`, `governance-stickiness-summary-blocked-reason.ts`, awaiting-action/decisions hooks |
| 629 | Architecture request query blocked-reason hook | `use-architecture-request-query.ts`, `architecture-request-blocked-reason.ts` |
| 630 | Advisory recommendations blocked-reason hook | `use-advisory-recommendations-query.ts`, `advisory-run-read-blocked-reason.ts` |
| 631 | Architecture-intelligence run model blocked-reason hook | `use-architecture-intelligence-run-model-query.ts`, `architecture-intelligence-run-model-blocked-reason.ts` |
| 632 | Finding provenance, export history, authority provenance alias clients | `use-finding-provenance-query.ts`, `run-export-history-api.ts`, `authority-provenance-query-api.ts` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave53ArchitectureTests.cs`.

**Hasher baseline note:** wave 53 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** see [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE54.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE54.md) (633–644).
