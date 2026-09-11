> **Scope:** Contributor-reference — wave-125 robustness controls for architecture create and review (branch `cursor/wave125-robustness-e14f`).

# Architecture create/review robustness — wave 125

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE124.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE124.md) (1473–1484 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 1485 | End-to-end compare read runtime **409** mapper | `RunComparisonController.Replay.cs` — `BuildEndToEndReportAsync`, `CompareRunsEndToEnd` |
| 1486 | End-to-end compare markdown export runtime **409** mapper | same file — `ExportRunsEndToEndComparisonMarkdown`, `DownloadRunsEndToEndComparisonMarkdown` |
| 1487 | End-to-end compare DOCX export runtime **409** mapper | same file — `ExportRunsEndToEndComparisonDocx` |
| 1488 | Comparison batch replay sealed guard runtime **409** mapper | `ComparisonsController.Replay.cs` — `ReplayComparisonsBatch`; `ComparisonsController.SealedManifestGuard.cs` |
| 1489 | Risk exceptions list runtime **409** mapper | `GovernanceStickinessController.Exceptions.cs` — `ListRiskExceptions` |
| 1490 | Recurrence schedules list runtime **409** mapper | `GovernanceStickinessController.Schedules.cs` — `ListRecurrenceSchedules` |
| 1491 | Export lineage verify runtime **409** mapper | `ArtifactExportController.Export.Verify.cs`, `ArtifactExportController.SealedManifestGuard.cs` — `VerifyRunExportLineage` |
| 1492 | Governance scope coverage read runtime **409** mapper | `GovernanceCoverageController.cs`, `GovernanceCoverageController.SealedManifestGuard.cs` — `GetScopeCoverage` |
| 1493 | Risk exceptions list GET `blockedReason` | `governance-stickiness-list-blocked-reason.ts`, `governance-stickiness-api-exceptions-schedules.ts` — `listRiskExceptions` |
| 1494 | Recurrence schedules list GET `blockedReason` | same API module — `listArchitectureReviewRecurrenceSchedules` |
| 1495 | Setup guide + governance resolution GET `blockedReason` | `governance-workflow-read-blocked-reason.ts`, `governance-workflow-api-dashboard.ts` — `fetchGovernanceSetupGuideBundle`, `getGovernanceResolution` |
| 1496 | Environment catalog GET `blockedReason` | `governance-workflow-read-blocked-reason.ts`, `governance-workflow-api-environments.ts` — `fetchGovernanceEnvironmentCatalog` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave125ArchitectureTests.cs`.

**Hasher baseline note:** wave 125 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** wave 58 setup resolution, coverage, and compare-agent follow-ups — see [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE126.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE126.md) (1497–1508) when opened.
