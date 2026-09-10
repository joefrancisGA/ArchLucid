> **Scope:** Contributor-reference — wave-96 robustness controls for architecture create and review (branch `cursor/wave96-robustness-e14f`).

# Architecture create/review robustness — wave 96

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE95.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE95.md) (1125–1136 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 1137 | Authority run-pair compare pin-fingerprint outcome **409** mapper | `AuthorityCompareController.cs` — `MapCompareSealedManifestConflict` |
| 1138 | Authority run-pair compare left lifecycle outcome **409** mapper | `AuthorityCompareController.cs` — `MapCompareSealedManifestConflict` |
| 1139 | Authority run-pair compare right lifecycle outcome **409** mapper | `AuthorityCompareController.cs` — `MapCompareSealedManifestConflict` |
| 1140 | Golden manifest version compare base lifecycle outcome **409** mapper | `ManifestsController.Compare.cs` — `MapGoldenManifestReadSealedManifestConflict` |
| 1141 | Golden manifest version compare target lifecycle outcome **409** mapper | `ManifestsController.Compare.cs` — `MapGoldenManifestReadSealedManifestConflict` |
| 1142 | Golden manifest version compare pin-fingerprint outcome **409** mapper | `ManifestsController.Compare.cs` — `MapGoldenManifestReadSealedManifestConflict` |
| 1143 | Golden manifest version compare artifact-inventory outcome **409** mapper | `ManifestsController.Compare.cs` — `MapGoldenManifestReadSealedManifestConflict` |
| 1144 | Comparison record summary GET `blockedReason` | `comparison-record-blocked-reason.ts`, `comparison-record-api.ts` — `getComparisonSummary` |
| 1145 | Risk exception create POST `blockedReason` | `risk-exception-mutation-blocked-reason.ts`, `governance-stickiness-api-exceptions-schedules.ts` — `createRiskException` |
| 1146 | Policy pack assignment enabled PUT `blockedReason` | `policy-pack-assign-mutation-blocked-reason.ts`, `policy-packs-api-assign.ts` — `setPolicyPackAssignmentEnabled` |
| 1147 | Review async execute POST `blockedReason` | `review-execute-mutation-blocked-reason.ts`, `architecture-runs-lifecycle.ts` — `executeArchitectureRunAsync` |
| 1148 | Sponsor preliminary share POST `blockedReason` | `sponsor-preliminary-share-mutation-blocked-reason.ts`, `architecture-sponsor-sharing-api.ts` — `recordSponsorPreliminaryArchitectureShare` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave96ArchitectureTests.cs`.

**Hasher baseline note:** wave 96 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** none — see [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE97.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE97.md) (1149–1160).

