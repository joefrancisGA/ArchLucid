> **Scope:** Contributor-reference — wave-36 robustness controls for architecture create and review (branch `cursor/wave36-robustness-e14f`).

# Architecture create/review robustness — wave 36

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE35.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE35.md) (405–416 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 417 | Export-record-diff replay regenerate lifecycle | `AuthorityLifecycleCompareExportGuard`, `ComparisonReplayService.RegenerateExportDiffAsync` |
| 418 | Live export-record compare lifecycle | `AuthorityLifecycleCompareExportGuard`, `RunExportQueryFacade.CompareExportRecordsAsync`, `CompareExportRecordsSummaryAsync` |
| 419 | One-pager execution-mode honesty | `BoardExportExecutionModeNoticeResolver`, `RunSummaryOnePagerDocumentFactory` |
| 420 | One-pager career export honesty | `CareerExportCoverageHonestyMaterialLoader`, `RunSummaryOnePagerExportService` |
| 421 | Package print route UI fail-closed | `run-collateral-sealed-manifest-guard.ts`, `PackagePrintPageClient` |
| 422 | Architecture sponsor sharing copy fail-closed | `run-collateral-sealed-manifest-guard.ts`, `ArchitectureSponsorSharingPanel` |
| 423 | Cloud resource hub snapshot-cited guard | `InfraEvidenceSnapshotSealedManifestHashGuard`, `CloudResourceEvidenceHubService.TryGetHubAsync` |
| 424 | Cloud resource hub 409 mapping | `CloudResourceEvidenceHubController.GetHub` |
| 425 | Infra-evidence ask 409 mapping | `InfraEvidenceAskGroundingService`, `InfraEvidenceAskController.Ask` |
| 426 | Infra-evidence ask snapshot-cited guard | `InfraEvidenceSnapshotSealedManifestHashGuard`, `InfraEvidenceAskSealedManifestHashGuard` |
| 427 | Sponsor packet top findings exclude muted | `RunSummaryOnePagerDocumentFactory.SelectTopHighCriticalFindings` |
| 428 | Drift report GET fail-closed when run-cited | `InfraEvidenceSnapshotSealedManifestHashGuard`, `AzureInventoryDriftClassificationService.TryGetDriftReportAsync`, `InfraEvidenceInventoryController.GetDriftReport` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave36ArchitectureTests.cs`.

**Hasher baseline note:** wave 36 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** none — closes hunt candidates #1425–#1427 from the 2026-09-05 seed pass.
