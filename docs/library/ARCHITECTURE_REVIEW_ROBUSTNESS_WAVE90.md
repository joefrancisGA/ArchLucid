> **Scope:** Contributor-reference — wave-90 robustness controls for architecture create and review (branch `cursor/wave90-robustness-e14f`).

# Architecture create/review robustness — wave 90

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE89.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE89.md) (1053–1064 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 1065 | Comparison read OpenAPI **409** guard partial | `ComparisonController.SealedManifestGuard.cs` — `MapComparisonSealedManifestConflict` |
| 1066 | Provenance graph read OpenAPI **409** guard partial | `ProvenanceController.SealedManifestGuard.cs` — `MapProvenanceSealedManifestConflict` |
| 1067 | Provenance query read OpenAPI **409** guard partial | `ProvenanceQueryController.SealedManifestGuard.cs` — `MapProvenanceQuerySealedManifestConflict` |
| 1068 | Run comparison read OpenAPI **409** guard partial | `RunComparisonController.SealedManifestGuard.cs` — `MapRunComparisonSealedManifestConflict` |
| 1069 | Governance resolution read OpenAPI **409** guard partial | `GovernanceResolutionController.SealedManifestGuard.cs` — `MapGovernanceResolutionSealedManifestConflict` |
| 1070 | Governance setup read OpenAPI **409** guard partial | `GovernanceSetupController.SealedManifestGuard.cs` — `MapGovernanceSetupSealedManifestConflict` |
| 1071 | Governance environment catalog read/write OpenAPI **409** guard partial | `GovernanceEnvironmentCatalogController.SealedManifestGuard.cs` — `MapGovernanceEnvironmentCatalogSealedManifestConflict` |
| 1072 | Comparison search GET `blockedReason` | `comparison-search-blocked-reason.ts`, `comparison-record-api.ts` — `searchComparisonRecords` |
| 1073 | Comparison record GET `blockedReason` | `comparison-record-blocked-reason.ts`, `comparison-record-api.ts` — `getComparisonRecord` |
| 1074 | Provenance graph GET `blockedReason` | `provenance-graph-alias-blocked-reason.ts`, `graph-api.ts` — `getProvenanceGraph` |
| 1075 | Authority provenance graph GET `blockedReason` | `authority-provenance-alias-blocked-reason.ts`, `authority-provenance-query-api.ts` — `getAuthorityProvenanceGraph` |
| 1076 | Governance environment catalog GET `blockedReason` | `governance-workflow-read-blocked-reason.ts`, `governance-workflow-api-environments.ts` — `fetchGovernanceEnvironmentCatalog` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave90ArchitectureTests.cs`.

**Hasher baseline note:** wave 90 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** none — see [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE91.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE91.md) (1077–1088).
