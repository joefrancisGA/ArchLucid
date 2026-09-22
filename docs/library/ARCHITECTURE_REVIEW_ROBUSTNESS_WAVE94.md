> **Scope:** Contributor-reference — wave-94 robustness controls for architecture create and review (branch `cursor/wave94-robustness-e14f`).

# Architecture create/review robustness — wave 94

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE93.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE93.md) (1101–1112 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 1113 | Run coverage acknowledgement PUT action-level **409** mapper | `RunCoverageController.Acknowledgement.cs` — `MapRunCoverageSealedManifestConflict` |
| 1114 | Run coverage pack PATCH action-level **409** mapper | `RunCoverageController.Acknowledgement.cs` — `MapRunCoverageSealedManifestConflict` |
| 1115 | Authority replay blocked POST action-level **409** mapper | `AuthorityReplayController.cs` — `MapAuthorityReplaySealedManifestConflict` |
| 1116 | First-value report PDF POST action-level **409** mapper | `PilotsController.Packs.cs` — `MapPilotPackSealedManifestConflict` |
| 1117 | Sponsor one-pager PDF POST action-level **409** mapper | `PilotsController.Packs.cs` — `MapPilotPackSealedManifestConflict` |
| 1118 | Authority run-pair compare sealed-hash outcome **409** mapper | `AuthorityCompareController.cs` — `MapCompareSealedManifestConflict` |
| 1119 | Golden manifest version compare sealed-hash outcome **409** mapper | `ManifestsController.Compare.cs` — `MapGoldenManifestReadSealedManifestConflict` |
| 1120 | Architecture request async create POST `blockedReason` | `architecture-request-create-mutation-blocked-reason.ts`, `architecture-runs-create-async.ts` — `createArchitectureRunAsync` |
| 1121 | Authority replay POST `blockedReason` | `review-replay-mutation-blocked-reason.ts`, `recommendation-replay-api.ts` — `replayRun` |
| 1122 | Policy pack create/publish POST `blockedReason` | `policy-pack-mutation-blocked-reason.ts`, `policy-packs-api-mutate.ts` — `createPolicyPack`, `publishPolicyPackVersion` |
| 1123 | Policy pack dry-run POST `blockedReason` | `policy-pack-dry-run-mutation-blocked-reason.ts`, `policy-packs-api-mutate.ts` — `dryRunPolicyPack` |
| 1124 | Compare/explain GET `blockedReason` | `compare-runs-load-blocked-reason.ts`, `compare-agent-results-blocked-reason.ts`, `explain-run-blocked-reason.ts`, `architecture-runs-compare.ts` — `compareRunsEndToEnd`, `compareAgentResults`, `compareAgentResultsSummary`, `explainRun` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave94ArchitectureTests.cs`.

**Hasher baseline note:** wave 94 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** none — see [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE95.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE95.md) (1125–1136).
