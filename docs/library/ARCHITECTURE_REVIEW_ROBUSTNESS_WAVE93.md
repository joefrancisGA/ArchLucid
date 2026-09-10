> **Scope:** Contributor-reference — wave-93 robustness controls for architecture create and review (branch `cursor/wave93-robustness-e14f`).

# Architecture create/review robustness — wave 93

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE92.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE92.md) (1089–1100 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 1101 | End-to-end run comparison build action-level **409** mapper | `RunComparisonController.Replay.cs` — `MapRunComparisonSealedManifestConflict` |
| 1102 | Manifest version compare load action-level **409** mapper | `ManifestsController.Compare.cs` — `MapGoldenManifestReadSealedManifestConflict` |
| 1103 | Operator demo review POST action-level **409** mapper | `ReviewsDemoController.cs` — `MapReviewsDemoSealedManifestConflict` |
| 1104 | Demo quickstart POST action-level **409** mapper | `QuickStartController.cs` — `MapQuickStartSealedManifestConflict` |
| 1105 | Operation cancel POST action-level **409** mapper | `OperationsController.cs` — `MapOperationsSealedManifestConflict` |
| 1106 | Reference evidence admin ZIP export action-level **409** mapper | `ReferenceEvidenceAdminZipResultFactory.cs` — `MapReferenceEvidenceAdminSealedManifestConflict` |
| 1107 | Authority manifest compare service action-level **409** mapper | `AuthorityCompareController.cs` — `MapCompareSealedManifestConflict` |
| 1108 | Architecture request create POST `blockedReason` | `architecture-request-create-mutation-blocked-reason.ts`, `architecture-runs-create-helpers.ts` — `postCreateArchitectureRun` |
| 1109 | Review async replay POST `blockedReason` | `review-async-replay-mutation-blocked-reason.ts`, `architecture-runs-lifecycle.ts` — `replayArchitectureRunAsync` |
| 1110 | Run coverage acknowledgement PUT `blockedReason` | `run-coverage-acknowledgement-mutation-blocked-reason.ts`, `run-coverage-api.ts` — `putRunCoverageAcknowledgement` |
| 1111 | Policy pack simulate POST `blockedReason` | `policy-pack-simulate-blocked-reason.ts`, `policy-packs-api-mutate.ts` — `simulatePolicyPackAgainstRun` |
| 1112 | Golden manifest compare / compare explain GET `blockedReason` | `compare-runs-load-blocked-reason.ts`, `compare-explain-mutation-blocked-reason.ts`, `architecture-runs-compare.ts` — `compareGoldenManifestRuns`, `explainComparisonRuns` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave93ArchitectureTests.cs`.

**Hasher baseline note:** wave 93 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** none — see [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE94.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE94.md) (1113–1124).
