> **Scope:** Contributor-reference — wave-83 robustness controls for architecture create and review (branch `cursor/wave83-robustness-e14f`).

# Architecture create/review robustness — wave 83

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE82.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE82.md) (969–980 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 981 | ROI sponsor read/export OpenAPI **409** guard partial | `RoiController.cs`; `RoiController.SealedManifestGuard.cs` — `MapRoiReadSealedManifestConflict` |
| 982 | Comparison replay POST OpenAPI **409** guard partial | `ComparisonsController.Replay.cs`; `ComparisonsController.SealedManifestGuard.cs` — `MapComparisonReplaySealedManifestConflict` |
| 983 | Export replay POST OpenAPI **409** guard partial | `ExportsController.cs`; `ExportsController.SealedManifestGuard.cs` — `MapExportReplaySealedManifestConflict` |
| 984 | Review-trail provenance/export GET OpenAPI **409** guard partial | `AuthorityReadsController.cs`; `AuthorityReadsController.SealedManifestGuard.cs` — `MapReviewTrailSealedManifestConflict` |
| 985 | Analysis report export OpenAPI **409** guard partial | `AnalysisReportsController.AnalyzeExport.cs`, `AnalysisReportsController.ConsultingDocx.Download.cs`; `AnalysisReportsController.SealedManifestGuard.cs` — `MapAnalysisReportExportSealedManifestConflict` |
| 986 | Artifact run export download OpenAPI **409** guard partial | `ArtifactExportController.Export.Download.cs`; `ArtifactExportController.SealedManifestGuard.cs` — `MapArtifactExportSealedManifestConflict` |
| 987 | Clarification questions GET OpenAPI **409** guard partial | `ReviewClarificationQuestionsController.cs`; `ReviewClarificationQuestionsController.SealedManifestGuard.cs` — `MapClarificationQuestionsSealedManifestConflict` |
| 988 | Generic sealed-manifest-aware GET `blockedReason` | `api-get-sealed-manifest-aware-blocked-reason.ts`, `api-get-sealed-manifest-aware.ts` |
| 989 | First-value report Markdown load `blockedReason` | `compare-runs-load-blocked-reason.ts`, `architecture-runs-compare.ts` — `getFirstValueReportMarkdown` |
| 990 | Run export ZIP download `blockedReason` | `run-export-zip-mutation-blocked-reason.ts`, `downloads-blob-trigger-run-export.ts` |
| 991 | Terraform advisory export ZIP `blockedReason` | `terraform-advisory-export-mutation-blocked-reason.ts`, `downloads-blob-trigger-terraform.ts` |
| 992 | Consulting DOCX export `blockedReason` | `consulting-docx-mutation-blocked-reason.ts`, `downloads-blob-trigger-reports.ts` — `downloadConsultingArchitectureReportDocx` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave83ArchitectureTests.cs`.

**Hasher baseline note:** wave 83 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** none — see [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE84.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE84.md) (993–1004).
