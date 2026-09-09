> **Scope:** Contributor-reference — wave-73 robustness controls for architecture create and review (branch `cursor/wave73-robustness-e14f`).

# Architecture create/review robustness — wave 73

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE72.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE72.md) (849–860 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 861 | Sponsor proof-pack ZIP GET OpenAPI **409** | `PilotsController.Packs.cs` — `GetSponsorProofPackZip`; `PilotsController.SealedManifestGuard.cs` |
| 862 | Sponsor review packet GET OpenAPI **409** | `PilotsController.Packs.cs` — `GetExecutiveReviewPacket`; `PilotsController.SealedManifestGuard.cs` |
| 863 | First-value report Markdown GET OpenAPI **409** | `PilotsController.Packs.cs` — `GetFirstValueReport`; `PilotsController.SealedManifestGuard.cs` |
| 864 | Sponsor ROI board-pack GET OpenAPI **409** | `RoiController.cs` — `GetSponsorReportBoardPackAsync`; `RoiController.SealedManifestGuard.cs` |
| 865 | Analysis report build/export POST OpenAPI **409** | `AnalysisReportsController.AnalyzeExport.cs` — `AnalyzeRun`, `ExportAnalysisReport`, `DownloadAnalysisReportExport`, `DownloadAnalysisReportDocx`, `DownloadAnalysisReportDocxAsync`; `AnalysisReportsController.SealedManifestGuard.cs` |
| 866 | Risk-exception create POST OpenAPI **409** | `GovernanceStickinessController.Exceptions.cs` — `CreateRiskException`; `GovernanceStickinessController.SealedManifestGuard.cs` |
| 867 | Finding disposition + merge-conflict POST OpenAPI **409** | `GovernanceStickinessController.Dispositions.cs` — `RecordDisposition`, `ResolveFindingMergeConflict`; bulk per-run guards in `GovernanceStickinessFacade.Findings.Dispositions.cs` — `RecordBulkDispositionAsync` |
| 868 | Pilot collateral download mutation `blockedReason` | `pilots-collateral-mutation-blocked-reason.ts`, `EmailRunToSponsorExportActions.tsx` |
| 869 | Sponsor ROI board-pack download mutation `blockedReason` | `sponsor-roi-board-pack-mutation-blocked-reason.ts`, `SponsorRoiSummarySection.tsx` |
| 870 | Consulting DOCX export mutation `blockedReason` | `consulting-docx-mutation-blocked-reason.ts`, `ConsultingDocxExportButton.tsx` |
| 871 | Run summary + package export mutation `blockedReason` | `run-summary-export-mutation-blocked-reason.ts`, `run-package-export-mutation-blocked-reason.ts`, `RunDetailPageHeader.tsx` |
| 872 | Architecture package DOCX mutation `blockedReason` | `architecture-package-docx-mutation-blocked-reason.ts`, `ManifestDeliverableGrid.tsx`, `EmailRunToSponsorExportActions.tsx` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave73ArchitectureTests.cs`.

**Hasher baseline note:** wave 73 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** none.
