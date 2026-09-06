> **Scope:** Contributor-reference — wave-34 robustness controls for architecture create and review (branch `cursor/wave34-robustness-e14f`).

# Architecture create/review robustness — wave 34

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE33.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE33.md) (379–391 carryover; closes wave 29 infra-evidence cross-plane batch 345–350).

| # | Control | Primary wiring |
|---|---------|----------------|
| 392 | Audit evidence package ZIP fail-closed when architecture links present | `AuditArchitectureEvidenceSealedManifestHashGuard`, `AuditEvidencePackageExportService.TryExportAsync` |
| 393 | Audit hybrid evidence query fail-closed when architecture source present | `AuditArchitectureEvidenceSealedManifestHashGuard`, `AuditHybridEvidenceQueryService` |
| 394 | Audit evidence lineage GET fail-closed when architecture links present | `AuditArchitectureEvidenceSealedManifestHashGuard`, `AuditEvidenceLineageService` |
| 395 | Snapshot Mermaid export fail-closed when run-cited | `InfraEvidenceSnapshotSealedManifestHashGuard`, `InfraEvidenceSnapshotMermaidService` |
| 396 | Snapshot Terraform advisory ZIP fail-closed when run-cited | `InfraEvidenceSnapshotSealedManifestHashGuard`, `AdvisoryTerraformRepresentationService` |
| 397 | Diagram model GET fail-closed on sealed hash | `StructuredDiagramIngestSealedManifestHashGuard`, `StructuredDiagramIngestService.TryGetModelAsync` |
| 398 | Post-commit projection outbox drain fail-closed on sealed hash | `PostCommitProjectionOutboxSealedManifestHashGuard`, `PostCommitProjectionOutboxProcessor` |
| 399 | Traceability-bundle ZIP maps `ConflictException` → 409 | `TraceabilityBundleExportApplicationService`, `AuthorityReadsController`, `RunQueryController` |
| 400 | Analysis async DOCX enqueue fail-closed + 409 | `ArchitectureAnalysisSealedManifestHashGuard`, `AnalysisReportsController.DownloadAnalysisReportDocxAsync` |
| 401 | Share-review-package UI fail-closed | `run-collateral-sealed-manifest-guard.ts`, `ShareReviewPackageButton` |
| 402 | Package-print UI fail-closed | `run-collateral-sealed-manifest-guard.ts`, `PackagePrintOpenButton`, `PackagePrintButton` |
| 403 | E2E compare export maps `ConflictException` → 409 | `RunComparisonController.Replay`, `EndToEndReplayComparisonService` |
| 404 | Data-consistency-check outbox drain skips hash when no `runId` | `IntegrationEventOutboxManifestHashGuard`, `DataConsistencyReconciliationHostedService` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave34ArchitectureTests.cs`.

**Hasher baseline note:** wave 34 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** wave 29 infra-evidence cross-plane batch (345–350) is closed in this wave.
