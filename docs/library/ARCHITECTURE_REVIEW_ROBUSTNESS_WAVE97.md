> **Scope:** Contributor-reference — wave-97 robustness controls for architecture create and review (branch `cursor/wave97-robustness-e14f`).

# Architecture create/review robustness — wave 97

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE96.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE96.md) (1137–1148 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 1149 | Decision receipt export sealed-hash outcome **409** mapper | `ArtifactExportController.Export.Download.cs` — `MapArtifactExportSealedManifestConflict` |
| 1150 | Decision receipt export sealed-incomplete outcome **409** mapper | `ArtifactExportController.Export.Download.cs` — `MapArtifactExportSealedManifestConflict` |
| 1151 | Run export package conflict outcome **409** mapper | `ArtifactExportController.Export.Download.cs` — `MapArtifactExportSealedManifestConflict` |
| 1152 | Export replay lineage-unverified outcome **409** mapper | `ExportsController.cs` — `MapExportReplaySealedManifestConflict` |
| 1153 | Export replay metadata lineage-unverified outcome **409** mapper | `ExportsController.cs` — `MapExportReplaySealedManifestConflict` |
| 1154 | Batch run create idempotency conflict outcome **409** mapper | `RunsController.Create.Batch.cs` — `MapRunsSealedManifestConflict` |
| 1155 | Artifact export missing-manifest sealed read **409** mapper | `ArtifactExportController.SealedManifestGuard.cs` — `MapArtifactExportSealedManifestConflict` |
| 1156 | Policy pack assignment organization-required PUT `blockedReason` | `policy-pack-assign-mutation-blocked-reason.ts`, `policy-packs-api-assign.ts` — `setPolicyPackAssignmentOrganizationRequired` |
| 1157 | Export lineage verify GET `blockedReason` | `export-lineage-verify-blocked-reason.ts`, `export-lineage-verify-api.ts` — `verifyRunExportLineage` |
| 1158 | Architecture identity PATCH `blockedReason` | `architecture-identity-mutation-blocked-reason.ts`, `architecture-identity-api.ts` — `patchArchitectureIdentity` |
| 1159 | Review archive PATCH `blockedReason` | `review-archive-mutation-blocked-reason.ts`, `architecture-runs-lifecycle.ts` — `archiveArchitectureRequest` |
| 1160 | Pre-finalize synthetic simulation POST `blockedReason` | `pre-finalize-synthetic-simulation-blocked-reason.ts`, `pre-finalize-synthetic-simulation-api.ts` — `simulatePreCommitSyntheticFindings` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave97ArchitectureTests.cs`.

**Hasher baseline note:** wave 97 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** none — see [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE98.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE98.md) (1161–1172).
| # | Control | Primary wiring |
|---|---------|----------------|
| 1149 | Decision receipt export sealed-hash outcome **409** mapper | `ArtifactExportController.Export.Download.cs` — `MapArtifactExportSealedManifestConflict` |
| 1150 | Decision receipt export sealed-incomplete outcome **409** mapper | `ArtifactExportController.Export.Download.cs` — `MapArtifactExportSealedManifestConflict` |
| 1151 | Run export package conflict outcome **409** mapper | `ArtifactExportController.Export.Download.cs` — `MapArtifactExportSealedManifestConflict` |
| 1152 | Export replay lineage-unverified outcome **409** mapper | `ExportsController.cs` — `MapExportReplaySealedManifestConflict` |
| 1153 | Export replay metadata lineage-unverified outcome **409** mapper | `ExportsController.cs` — `MapExportReplaySealedManifestConflict` |
| 1154 | Batch run create idempotency conflict outcome **409** mapper | `RunsController.Create.Batch.cs` — `MapRunsSealedManifestConflict` |
| 1155 | Artifact export missing-manifest sealed read **409** mapper | `ArtifactExportController.SealedManifestGuard.cs` — `MapArtifactExportSealedManifestConflict` |
| 1156 | Policy pack assignment organization-required PUT `blockedReason` | `policy-pack-assign-mutation-blocked-reason.ts`, `policy-packs-api-assign.ts` — `setPolicyPackAssignmentOrganizationRequired` |
| 1157 | Export lineage verify GET `blockedReason` | `export-lineage-verify-blocked-reason.ts`, `export-lineage-verify-api.ts` — `verifyRunExportLineage` |
| 1158 | Architecture identity PATCH `blockedReason` | `architecture-identity-mutation-blocked-reason.ts`, `architecture-identity-api.ts` — `patchArchitectureIdentity` |
| 1159 | Review archive PATCH `blockedReason` | `review-archive-mutation-blocked-reason.ts`, `architecture-runs-lifecycle.ts` — `archiveArchitectureRequest` |
| 1160 | Pre-finalize synthetic simulation POST `blockedReason` | `pre-finalize-synthetic-simulation-blocked-reason.ts`, `pre-finalize-synthetic-simulation-api.ts` — `simulatePreCommitSyntheticFindings` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave97ArchitectureTests.cs`.

**Hasher baseline note:** wave 97 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** none — see [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE98.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE98.md) (1161–1172).

