> **Scope:** Contributor-reference — wave-57 robustness controls for architecture create and review (branch `cursor/wave57-robustness-e14f`).

# Architecture create/review robustness — wave 57

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE56.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE56.md) (657–668 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 669 | End-to-end compare read OpenAPI **409** | `RunComparisonController.Replay.cs`, `RunComparisonController.SealedManifestGuard.cs` |
| 670 | End-to-end compare markdown export read OpenAPI **409** | `RunComparisonController.Replay.cs` |
| 671 | End-to-end compare DOCX export read OpenAPI **409** | `RunComparisonController.Replay.cs` |
| 672 | Comparison batch replay read guard parity | `ComparisonsController.Replay.cs`, `ComparisonsController.SealedManifestGuard.cs` |
| 673 | Risk exceptions list register guard + OpenAPI **409** | `GovernanceStickinessController.Exceptions.cs`, `GovernanceStickinessFacade.Findings.RiskExceptions.cs` |
| 674 | Recurrence schedules list register guard + OpenAPI **409** | `GovernanceStickinessController.Schedules.cs`, `GovernanceStickinessFacade.Recurrence.cs` |
| 675 | Export lineage verify read OpenAPI **409** | `ArtifactExportController.Export.Verify.cs`, `ArtifactExportController.SealedManifestGuard.cs` |
| 676 | Governance scope coverage read sealed-manifest guard | `GovernanceCoverageController.cs`, `GovernanceCoverageController.SealedManifestGuard.cs` |
| 677 | Risk exceptions list sealed client | `governance-stickiness-api-exceptions-schedules.ts`, `use-risk-exceptions-query.ts`, `governance-stickiness-list-blocked-reason.ts` |
| 678 | Recurrence schedules list sealed client | `governance-stickiness-api-exceptions-schedules.ts`, `use-recurrence-schedules-query.ts`, `governance-stickiness-list-blocked-reason.ts` |
| 679 | Setup guide + governance resolution sealed clients | `governance-workflow-api-dashboard.ts`, `governance-workflow-read-blocked-reason.ts` |
| 680 | Environment catalog sealed client | `governance-workflow-api-environments.ts`, `governance-workflow-read-blocked-reason.ts` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave57ArchitectureTests.cs`.

**Hasher baseline note:** wave 57 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** see [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE58.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE58.md) (681–692).
