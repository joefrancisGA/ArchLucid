> **Scope:** Contributor-reference — wave-74 robustness controls for architecture create and review (branch `cursor/wave74-robustness-e14f`).

# Architecture create/review robustness — wave 74

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE73.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE73.md) (861–872 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 873 | Risk-exception renew POST OpenAPI **409** | `GovernanceStickinessController.Exceptions.cs` — `RenewRiskException`; `GovernanceStickinessController.SealedManifestGuard.cs` — `EnsureRiskExceptionRunSealedManifestAllowedAsync` |
| 874 | Risk-exception revoke POST OpenAPI **409** | `GovernanceStickinessController.Exceptions.cs` — `RevokeRiskException`; `GovernanceStickinessController.SealedManifestGuard.cs` |
| 875 | Bulk finding disposition POST OpenAPI **409** | `GovernanceStickinessController.Dispositions.cs` — `RecordBulkDisposition`; `EnsureBulkDispositionSealedManifestAllowedAsync` |
| 876 | Run export ZIP GET OpenAPI **409** | `ArtifactExportController.Export.Download.cs` — `DownloadRunExport`; `ArtifactExportController.SealedManifestGuard.cs` |
| 877 | Decision receipt JSON GET OpenAPI **409** | `ArtifactExportController.Export.Download.cs` — `DownloadRunDecisionReceipt`; `ArtifactExportController.SealedManifestGuard.cs` |
| 878 | Sponsor ROI read GET OpenAPI **409** | `RoiController.cs` — `GetSponsorDashboardBundleAsync`, `GetSponsorReportAsync`, `GetSponsorReportExportAsync`, `GetSponsorReportHistoryAsync`; `RoiController.SealedManifestGuard.cs` — `EnsureSponsorRoiSealedManifestReadAllowedAsync` |
| 879 | Draft intake patch OpenAPI **409** | `DraftRequestsController.cs` — `PatchDraft`; `DraftRequestsController.SealedManifestGuard.cs` |
| 880 | Policy pack assignment mutation OpenAPI **409** | `PolicyPacksController.Assignment.cs` — `Assign`, `ArchiveAssignment`, `SetAssignmentEnabled`, `SetAssignmentOrganizationRequired`; `PolicyPacksController.SealedManifestGuard.cs` |
| 881 | Consulting DOCX export POST OpenAPI **409** | `AnalysisReportsController.ConsultingDocx.Download.cs` — `DownloadConsultingDocx`; `AnalysisReportsController.SealedManifestGuard.cs` |
| 882 | Recurrence schedule create/update OpenAPI **409** | `GovernanceStickinessController.Schedules.cs` — `CreateRecurrenceSchedule`, `UpdateRecurrenceSchedule`; `RecurrenceScheduleCreateSealedManifestHashGuard` |
| 883 | Artifact bundle download mutation `blockedReason` | `artifact-bundle-mutation-blocked-reason.ts`, `ManifestDeliverableGrid.tsx`, `EmailRunToSponsorExportActions.tsx`, `RunDetailArtifactsExportsSection.tsx` |
| 884 | Run export ZIP download mutation `blockedReason` | `run-export-zip-mutation-blocked-reason.ts`, `EmailRunToSponsorExportActions.tsx`, `RunDetailArtifactsExportsSection.tsx` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave74ArchitectureTests.cs`.

**Hasher baseline note:** wave 74 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** none.
