> **Scope:** Contributor-reference — wave-95 robustness controls for architecture create and review (branch `cursor/wave95-robustness-e14f`).

# Architecture create/review robustness — wave 95

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE94.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE94.md) (1113–1124 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 1125 | Architecture run summary export action-level **409** mapper | `ArchitectureExportController.cs` — `MapArchitectureExportSealedManifestConflict` |
| 1126 | Run export download action-level **409** mapper | `RunsExportController.cs` — `MapRunsExportSealedManifestConflict` |
| 1127 | Architecture package DOCX export lifecycle action-level **409** mapper | `DocxExportController.cs` — `MapDocxExportSealedManifestConflict` |
| 1128 | Policy pack assignment archive conflict outcome **409** mapper | `PolicyPacksController.Assignment.cs` — `MapPolicyPackSealedManifestConflict` |
| 1129 | Sponsor pack sent not-committed outcome **409** mapper | `PilotsController.Packs.cs` — `MapPilotPackSealedManifestConflict` |
| 1130 | Sponsor preliminary share override outcome **409** mapper | `PilotsController.Packs.cs` — `MapPilotPackSealedManifestConflict` |
| 1131 | Authority run-pair compare artifact-inventory mismatch outcome **409** mapper | `AuthorityCompareController.cs` — `MapCompareSealedManifestConflict` |
| 1132 | Policy pack assign/archive POST `blockedReason` | `policy-pack-assign-mutation-blocked-reason.ts`, `policy-packs-api-assign.ts` — `assignPolicyPack`, `archivePolicyPackAssignment` |
| 1133 | Governance environment activate POST `blockedReason` | `governance-workflow-mutation-blocked-reason.ts`, `governance-workflow-api-environments.ts` — `activateEnvironment` |
| 1134 | Governance environment catalog PUT `blockedReason` | `governance-environment-catalog-mutation-blocked-reason.ts`, `governance-workflow-api-environments.ts` — `replaceGovernanceEnvironmentCatalog` |
| 1135 | Review pin PATCH `blockedReason` | `review-pin-mutation-blocked-reason.ts`, `architecture-runs-lifecycle.ts` — `pinArchitectureRun` |
| 1136 | Sponsor pack sent POST `blockedReason` | `sponsor-pack-sent-mutation-blocked-reason.ts`, `downloads-export-jobs.ts` — `markSponsorPackSent` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave95ArchitectureTests.cs`.

**Hasher baseline note:** wave 95 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** none — see [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE96.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE96.md) (1137–1148) when opened.
