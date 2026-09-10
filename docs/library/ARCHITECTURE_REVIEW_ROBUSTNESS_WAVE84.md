> **Scope:** Contributor-reference — wave-84 robustness controls for architecture create and review (branch `cursor/wave84-robustness-e14f`).

# Architecture create/review robustness — wave 84

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE83.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE83.md) (981–992 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 993 | Advisory recommendation apply OpenAPI **409** guard partial | `AdvisoryController.cs`; `AdvisoryController.SealedManifestGuard.cs` — `MapAdvisorySealedManifestConflict` |
| 994 | Authority query provenance/retrieval GET OpenAPI **409** guard partial | `AuthorityQueryController.Trail.cs`, `AuthorityQueryController.RunDetail.cs`; `AuthorityQueryController.SealedManifestGuard.cs` — `MapRunQuerySealedManifestConflict` |
| 995 | Architecture package DOCX export OpenAPI **409** guard partial | `DocxExportController.cs`; `DocxExportController.SealedManifestGuard.cs` — `MapDocxExportSealedManifestConflict` |
| 996 | Technology ledger PATCH OpenAPI **409** guard partial | `TechnologyLedgerController.cs`; `TechnologyLedgerController.SealedManifestGuard.cs` — `MapTechnologyLedgerSealedManifestConflict` |
| 997 | Remediation instance list/detail GET OpenAPI **409** guard partial | `RemediationInstancesController.cs`; `RemediationInstancesController.SealedManifestGuard.cs` — `MapRemediationInstanceSealedManifestConflict` |
| 998 | Diagram ingest GET/POST OpenAPI **409** guard partial | `ArchitectureDiagramIngestController.cs`; `ArchitectureDiagramIngestController.SealedManifestGuard.cs` — `MapDiagramIngestSealedManifestConflict` |
| 999 | Cloud resource evidence hub GET OpenAPI **409** guard partial | `CloudResourceEvidenceHubController.cs`; `CloudResourceEvidenceHubController.SealedManifestGuard.cs` — `MapEvidenceHubSealedManifestConflict` |
| 1000 | First-value report PDF download `blockedReason` | `first-value-report-mutation-blocked-reason.ts`, `downloads-blob-trigger-reports.ts` — `downloadFirstValueReportPdf` |
| 1001 | Board pack PDF download `blockedReason` | `board-pack-mutation-blocked-reason.ts`, `downloads-blob-trigger-reports.ts` — `downloadBoardPackPdf` |
| 1002 | Sponsor one-pager PDF download `blockedReason` | `sponsor-one-pager-mutation-blocked-reason.ts`, `downloads-blob-trigger-reports.ts` — `downloadSponsorOnePagerPdf` |
| 1003 | Sponsor ROI CSV export `blockedReason` | `sponsor-roi-csv-export-mutation-blocked-reason.ts`, `downloads-blob-trigger-sponsor-roi-csv-export.ts` |
| 1004 | Value report DOCX export `blockedReason` | `sponsor-value-report-docx-mutation-blocked-reason.ts`, `downloads-export-jobs.ts` — `downloadValueReportDocx` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave84ArchitectureTests.cs`.

**Hasher baseline note:** wave 84 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** none — see [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE85.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE85.md) (1005–1016) when opened.
