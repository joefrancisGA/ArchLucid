> **Scope:** Contributor-reference — wave-91 robustness controls for architecture create and review (branch `cursor/wave91-robustness-e14f`).

# Architecture create/review robustness — wave 91

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE90.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE90.md) (1065–1076 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 1077 | Authority replay POST action-level **409** mapper | `AuthorityReplayController.cs` — `MapAuthorityReplaySealedManifestConflict` |
| 1078 | Governance preview POST action-level **409** mapper | `GovernancePreviewController.cs` — `MapGovernancePreviewSealedManifestConflict` |
| 1079 | Governance compare-environments POST action-level **409** mapper | `GovernancePreviewController.cs` — `MapGovernancePreviewSealedManifestConflict` |
| 1080 | Governance posture GET action-level **409** mapper | `GovernancePostureController.cs` — `MapGovernancePostureSealedManifestConflict` |
| 1081 | Policy pack CRUD action-level **409** mapper | `PolicyPacksController.Crud.cs` — `MapPolicyPackSealedManifestConflict` |
| 1082 | Run execute / selective execute action-level **409** mapper | `RunsController.Execute.cs` — `MapRunsSealedManifestConflict` |
| 1083 | Governance mutation correction POST action-level **409** mapper | `GovernanceController.MutationCorrections.cs` — `MapGovernanceSealedManifestConflict` |
| 1084 | Governance setup guide GET `blockedReason` | `governance-workflow-read-blocked-reason.ts`, `governance-workflow-api-dashboard.ts` — `fetchGovernanceSetupGuideBundle` |
| 1085 | Governance resolution GET `blockedReason` | `governance-workflow-read-blocked-reason.ts`, `governance-workflow-api-dashboard.ts` — `getGovernanceResolution` |
| 1086 | Compare runs GET `blockedReason` | `compare-runs-load-blocked-reason.ts`, `architecture-runs-compare.ts` — `compareRuns` |
| 1087 | Review execute POST `blockedReason` | `review-execute-mutation-blocked-reason.ts`, `architecture-runs-lifecycle.ts` — `executeArchitectureRun` |
| 1088 | Manifest summary GET `blockedReason` | `manifest-summary-read-blocked-reason.ts`, `architecture-runs-artifacts.ts` — `getManifestSummary` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave91ArchitectureTests.cs`.

**Hasher baseline note:** wave 91 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** none — see [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE92.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE92.md) (1089–1100) when opened.
