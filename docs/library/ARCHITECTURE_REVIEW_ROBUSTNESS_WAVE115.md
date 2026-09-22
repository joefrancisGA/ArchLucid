> **Scope:** Contributor-reference — wave-115 robustness controls for architecture create and review (branch `cursor/wave115-robustness-e14f`).

# Architecture create/review robustness — wave 115

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE114.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE114.md) (1353–1364 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 1365 | Sponsor summary export GET runtime **409** mapper | `ArchitectureExportController.cs` — `ExportRunSummary` |
| 1366 | Architecture export sealed guard runtime **409** mapper | `ArchitectureExportController.SealedManifestGuard.cs` — `MapArchitectureExportSealedManifestConflict` |
| 1367 | Run package export GET runtime **409** mapper | `RunsExportController.cs` — `Export` |
| 1368 | Run export sealed guard runtime **409** mapper | `RunsExportController.SealedManifestGuard.cs` — `MapRunsExportSealedManifestConflict` |
| 1369 | Run summary SSE runtime **409** mapper | `AuthorityRunEventsController.cs` — `GetRunEvents` |
| 1370 | Run events sealed guard runtime **409** mapper | `AuthorityRunEventsController.SealedManifestGuard.cs` — `MapRunEventsSealedManifestConflict` |
| 1371 | Run summary GET runtime **409** mapper | `AuthorityQueryController.RunDetail.cs` — `GetRunSummary` |
| 1372 | Sponsor summary export download `blockedReason` | `run-summary-export-mutation-blocked-reason.ts`, `downloads-blob-trigger-run-summary-export.ts` — `downloadRunSummaryExport` |
| 1373 | Sponsor summary export URL anchor | `downloads-blob-urls.ts`, `run-summary-export-api.ts` — `getRunSummaryExportUrl` |
| 1374 | Sponsor summary export API barrel | `run-summary-export-api.ts` — re-exports download, URL, and blockedReason |
| 1375 | Run detail header sponsor export anchor | `RunDetailPageHeader.tsx` — imports from `run-summary-export-api.ts` |
| 1376 | Sponsor brief export fail-closed UX | `RunDetailPageHeader.tsx` — `runSummaryExportMutationBlockedReason` on download errors |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave115ArchitectureTests.cs`.

**Hasher baseline note:** wave 115 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** wave 51 run summary read/SSE client follow-ups — see [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE116.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE116.md) (1377–1388) when opened.
