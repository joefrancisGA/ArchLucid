> **Scope:** Contributor-reference — wave-92 robustness controls for architecture create and review (branch `cursor/wave92-robustness-e14f`).

# Architecture create/review robustness — wave 92

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE91.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE91.md) (1077–1088 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 1089 | Run create POST action-level **409** mapper | `RunsController.Create.Sync.cs` — `MapRunsSealedManifestConflict` |
| 1090 | Run create async POST action-level **409** mapper | `RunsController.AsyncOperations.cs` — `MapRunsSealedManifestConflict` |
| 1091 | Run finalize POST action-level **409** mapper | `RunsController.CommitReplayPin.Commit.cs` — `MapRunsSealedManifestConflict` |
| 1092 | Run replay POST action-level **409** mapper | `RunsController.CommitReplayPin.Replay.cs` — `MapRunsSealedManifestConflict` |
| 1093 | Governance approval approve/reject POST action-level **409** mapper | `GovernanceController.ApprovalRequests.Review.cs` — `MapGovernanceSealedManifestConflict` |
| 1094 | Governance dashboard GET action-level **409** mapper | `GovernanceController.Insights.cs` — `MapGovernanceSealedManifestConflict` |
| 1095 | Governance compliance drift trend GET action-level **409** mapper | `GovernanceController.Insights.cs` — `MapGovernanceSealedManifestConflict` |
| 1096 | Governance dashboard GET `blockedReason` | `governance-dashboard-blocked-reason.ts`, `governance-workflow-api-dashboard.ts` — `getGovernanceDashboard` |
| 1097 | Compliance drift trend GET `blockedReason` | `governance-dashboard-blocked-reason.ts`, `governance-workflow-api-dashboard.ts` — `getComplianceDriftTrend` |
| 1098 | Review finalize POST `blockedReason` | `review-finalize-mutation-blocked-reason.ts`, `architecture-runs-lifecycle.ts` — `commitArchitectureRun` |
| 1099 | Review selective execute POST `blockedReason` | `review-selective-execute-mutation-blocked-reason.ts`, `architecture-runs-lifecycle.ts` — `executeArchitectureRunSelective` |
| 1100 | Governance mutation correction POST `blockedReason` | `governance-mutation-correction-blocked-reason.ts`, `governance-mutation-correction-api.ts` — `recordGovernanceMutationCorrection` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave92ArchitectureTests.cs`.

**Hasher baseline note:** wave 92 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** none — see [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE93.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE93.md) (1101–1112) when opened.
