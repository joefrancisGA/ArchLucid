> **Scope:** Contributor-reference — wave-76 robustness controls for architecture create and review (branch `cursor/wave76-robustness-e14f`).

# Architecture create/review robustness — wave 76

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE75.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE75.md) (885–896 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 897 | Policy-pack simulate POST OpenAPI **409** | `PolicyPacksController.Simulate.cs` — `Simulate`; `PolicyPacksController.SealedManifestGuard.cs` — `EnsurePolicyPackSimulateRunSealedManifestAllowedAsync` |
| 898 | Policy-pack simulate-bulk POST OpenAPI **409** | `PolicyPacksController.Simulate.cs` — `SimulateBulk`; `EnsurePolicyPackSimulateBulkRunIdsSealedManifestAllowedAsync` |
| 899 | Finding unmute DELETE OpenAPI **409** | `FindingMuteController.Unmute.cs` — `DeleteMuteAsync`; `IFindingRecordMuteRepository.TryUnmuteAsync` |
| 900 | Pilot recent-deltas GET OpenAPI **409** | `PilotsController.Deltas.cs` — `GetRecentDeltas`; `EnsurePilotRecentDeltasSealedManifestReadAllowedAsync` |
| 901 | Structured diagram ingest POST OpenAPI **409** | `ArchitectureDiagramIngestController.cs` — `Ingest`; `ArchitectureDiagramIngestController.SealedManifestGuard.cs` |
| 902 | Diagram reconciliation POST/GET OpenAPI **409** | `ArchitectureDiagramReconciliationController.cs` — `Reconcile`, `GetReconciliation`; `ArchitectureDiagramReconciliationController.SealedManifestGuard.cs` |
| 903 | Vision diagram ingest POST OpenAPI **409** | `ArchitectureDiagramVisionIngestController.cs` — `VisionIngest`; `ArchitectureDiagramVisionIngestController.SealedManifestGuard.cs` |
| 904 | Finding unmute mutation `blockedReason` | `finding-unmute-mutation-blocked-reason.ts`, `finding-unmute-client.ts`, `findings-api.ts` |
| 905 | Whitelabel consulting DOCX export `blockedReason` | `consulting-docx-mutation-blocked-reason.ts`, `ReviewBoardWhitelabelConsultingExportButton.tsx` |
| 906 | Meeting packet / header share run-package export `blockedReason` | `run-package-export-mutation-blocked-reason.ts`, `ReviewMeetingPacketButton.tsx`, `ReviewHeaderShareMenu.tsx` |
| 907 | Per-artifact + traceability bundle download `blockedReason` | `artifact-bundle-mutation-blocked-reason.ts`, `ArtifactListTable.tsx`, `RunDetailRunActionsSection.tsx` |
| 908 | Pilot closeout POST `blockedReason` client | `pilot-closeout-mutation-blocked-reason.ts`, `pilot-closeout-client.ts` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave76ArchitectureTests.cs`.

**Hasher baseline note:** wave 76 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** none — see [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE77.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE77.md) (909–920).
