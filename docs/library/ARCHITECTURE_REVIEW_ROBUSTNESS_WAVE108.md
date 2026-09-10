> **Scope:** Contributor-reference — wave-108 robustness controls for architecture create and review (branch `cursor/wave108-robustness-e14f`).

# Architecture create/review robustness — wave 108

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE107.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE107.md) (1269–1280 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 1281 | Run agent evaluation GET runtime **409** mapper | `RunAgentEvaluationController.cs` — `MapRunAgentEvaluationSealedManifestConflict` |
| 1282 | Provenance alias graph GET runtime **409** mapper | `ProvenanceController.cs` — `MapProvenanceSealedManifestConflict` |
| 1283 | Authority provenance query GET runtime **409** mapper | `ProvenanceQueryController.cs` — `MapProvenanceQuerySealedManifestConflict` |
| 1284 | Governance resolution GET runtime **409** mapper | `GovernanceResolutionController.cs` — `MapGovernanceResolutionSealedManifestConflict` |
| 1285 | Governance setup guide GET runtime **409** mapper | `GovernanceSetupController.cs` — `MapGovernanceSetupSealedManifestConflict` |
| 1286 | Governance environment catalog GET/PUT runtime **409** mapper | `GovernanceEnvironmentCatalogController.cs` — `MapGovernanceEnvironmentCatalogSealedManifestConflict` |
| 1287 | Run coverage acknowledgement GET runtime **409** mapper | `RunCoverageController.Acknowledgement.cs` — `MapRunCoverageSealedManifestConflict` |
| 1288 | Authority provenance snapshot GET `blockedReason` | `authority-provenance-alias-blocked-reason.ts`, `authority-provenance-query-api.ts` — `getAuthorityProvenanceSnapshot` |
| 1289 | Authority provenance decision/neighborhood GET `blockedReason` | same helper — `getAuthorityProvenanceDecisionGraph`, `getAuthorityProvenanceNodeNeighborhood` |
| 1290 | Provenance alias decision/neighborhood GET `blockedReason` | `provenance-graph-alias-blocked-reason.ts`, `graph-api.ts` — `getDecisionSubgraph`, `getNodeNeighborhood` |
| 1291 | Run comparison history GET `blockedReason` | `run-comparison-history-blocked-reason.ts`, `run-comparison-history-api.ts` — `getRunComparisonHistory` |
| 1292 | Governance activations list GET `blockedReason` | `governance-workflow-read-blocked-reason.ts`, `governance-workflow-api-environments.ts` — `listActivations` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave108ArchitectureTests.cs`.

**Hasher baseline note:** wave 108 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** wave 86/90 guard-partial follow-ups completed in wave 109 — see [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE110.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE110.md) (1305–1316) when opened.
