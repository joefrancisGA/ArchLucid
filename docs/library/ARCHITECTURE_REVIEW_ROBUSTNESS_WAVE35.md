> **Scope:** Contributor-reference — wave-35 robustness controls for architecture create and review (branch `cursor/wave35-robustness-e14f`).

# Architecture create/review robustness — wave 35

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE34.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE34.md) (392–404 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 405 | Export replay lifecycle fail-closed | `AuthorityLifecycleCompareExportGuard`, `ExportReplayService.ReplayAsync` |
| 406 | Export replay maps `ConflictException` → 409 | `ExportsController.ReplayExportRecord`, `ExportsController.ReplayExportRecordMetadata` |
| 407 | Blob push sealed-hash preflight at accept | `ArtifactExportController.PushRunExportToBlob`, `EnsureSealedManifestHashOrConflict` |
| 408 | Drift snapshot list fail-closed when run-cited | `InfraEvidenceSnapshotSealedManifestHashGuard`, `InfraEvidenceDriftWorkbenchQueryService.ListSnapshotsAsync` |
| 409 | Drift diff list fail-closed when run-cited | `InfraEvidenceSnapshotSealedManifestHashGuard`, `InfraEvidenceDriftWorkbenchQueryService.ListDiffsForSnapshotAsync` |
| 410 | Drift semantic changes GET fail-closed when run-cited | `InfraEvidenceSnapshotSealedManifestHashGuard`, `InfraEvidenceDriftWorkbenchQueryService.ListChangesForDiffAsync` |
| 411 | Comparison replay maps `ConflictException` → 409 | `ComparisonsController.ReplayComparison`, `ComparisonsController.ReplayComparisonMetadata` |
| 412 | Comparison replay regenerate lifecycle parity | `AuthorityLifecycleCompareExportGuard`, `ComparisonReplayService.RegenerateEndToEndAsync` |
| 413 | Board export execution-mode honesty (Fallback/Mixed/substitution) | `BoardExportExecutionModeNoticeResolver`, `ArchitectureReviewBoardExportDocumentFactory` |
| 414 | Shareable review link UI fail-closed | `run-collateral-sealed-manifest-guard.ts`, `ShareableReviewLinkButton` |
| 415 | Export deliverable picker UI fail-closed | `run-collateral-sealed-manifest-guard.ts`, `ExportDeliverableDialog` |
| 416 | Review presenter mode UI fail-closed | `run-collateral-sealed-manifest-guard.ts`, `ReviewPresenterHeaderButton` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave35ArchitectureTests.cs`.

**Hasher baseline note:** wave 35 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** none — closes hunt candidates #1422–#1424 from the 2026-09-05 seed pass.
