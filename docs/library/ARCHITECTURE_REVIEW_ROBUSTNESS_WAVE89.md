> **Scope:** Contributor-reference — wave-89 robustness controls for architecture create and review (branch `cursor/wave89-robustness-e14f`).

# Architecture create/review robustness — wave 89

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE88.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE88.md) (1041–1052 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 1053 | Run export GET OpenAPI **409** guard partial | `RunsExportController.SealedManifestGuard.cs` — `MapRunsExportSealedManifestConflict` |
| 1054 | Architecture export summary GET OpenAPI **409** guard partial | `ArchitectureExportController.SealedManifestGuard.cs` — `MapArchitectureExportSealedManifestConflict` |
| 1055 | Governance coverage GET OpenAPI **409** guard partial | `GovernanceCoverageController.SealedManifestGuard.cs` — `MapGovernanceCoverageSealedManifestConflict` |
| 1056 | Governance posture GET OpenAPI **409** guard partial | `GovernancePostureController.SealedManifestGuard.cs` — `MapGovernancePostureSealedManifestConflict` |
| 1057 | Governance preview POST OpenAPI **409** guard partial | `GovernancePreviewController.SealedManifestGuard.cs` — `MapGovernancePreviewSealedManifestConflict` |
| 1058 | Retrieval search GET OpenAPI **409** guard partial | `RetrievalController.SealedManifestGuard.cs` — `MapRetrievalSealedManifestConflict` |
| 1059 | Finding feedback POST OpenAPI **409** guard partial | `FindingFeedbackController.SealedManifestGuard.cs` — `MapFindingFeedbackSealedManifestConflict` |
| 1060 | Governance scope coverage GET `blockedReason` | `governance-coverage-blocked-reason.ts`, `governance-coverage-api.ts` — `getGovernanceScopeCoverage` |
| 1061 | Governance posture GET `blockedReason` | `governance-posture-blocked-reason.ts`, `governance-stickiness-api-registers.ts` — `getGovernancePosture` |
| 1062 | Finding feedback POST `blockedReason` | `finding-feedback-mutation-blocked-reason.ts`, `findings-api.ts` — `postFindingFeedback` / `postArchitectureFindingFeedback` |
| 1063 | Run provenance GET `blockedReason` | `run-provenance-blocked-reason.ts`, `architecture-runs-read-detail-artifacts.ts` — `getRunProvenance` |
| 1064 | Retrieval search GET `blockedReason` | `ask-blocked-reason.ts`, `retrieval-search-api.ts` — `fetchRetrievalSearchHits` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave89ArchitectureTests.cs`.

**Hasher baseline note:** wave 89 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** none — see [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE90.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE90.md) (1065–1076).
