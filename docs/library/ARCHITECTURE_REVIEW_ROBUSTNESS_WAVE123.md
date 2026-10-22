> **Scope:** Contributor-reference — wave-123 robustness controls for architecture create and review (branch `cursor/wave123-robustness-e14f`).

# Architecture create/review robustness — wave 123

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE122.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE122.md) (1449–1460 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 1461 | Export-record compare GET runtime **409** mapper | `ExportsController.cs` — `CompareExportRecords` |
| 1462 | Export-record compare summary POST runtime **409** mapper | same file — `CompareExportRecordsSummary` |
| 1463 | Comparison replay cost-estimate GET runtime **409** mapper | `ComparisonsController.Replay.cs` — `GetComparisonReplayCostEstimate` |
| 1464 | Comparison drift analyze + report GET runtime **409** mapper | `ComparisonsController.Drift.cs` — `AnalyzeComparisonDrift`, `GetComparisonDriftReport` |
| 1465 | Comparison search sealed guard runtime **409** mapper | `ComparisonsController.SealedManifestGuard.cs` — `EnsureSealedManifestReadAllowedForComparisonSearchQueryAsync` |
| 1466 | Trace forensics sealed guard runtime **409** mapper | `InternalArchitectureTraceForensicsController.SealedManifestGuard.cs` — `EnsureSealedManifestReadAllowedAsync` |
| 1467 | Assigned-to-me count register GET runtime **409** mapper | `GovernanceStickinessController.Registers.cs` — `GetAssignedToMeFindingsCount` |
| 1468 | Export-record compare GET `blockedReason` | `export-record-compare-blocked-reason.ts`, `export-record-compare-api.ts` — `compareExportRecords` |
| 1469 | Comparison replay cost-estimate GET `blockedReason` | `comparison-replay-cost-blocked-reason.ts`, `comparison-replay-cost-api.ts` |
| 1470 | Assigned-to-me count GET `blockedReason` | `governance-assigned-to-me-count-blocked-reason.ts`, `governance-stickiness-api-registers.ts` — `getGovernanceAssignedToMeFindingsCount` |
| 1471 | Architecture graph read GET `blockedReason` | `architecture-graph-temporal-snapshot-blocked-reason.ts`, `graph-api.ts` — `getArchitectureGraph` |
| 1472 | Export compare + replay cost + assigned count fail-closed UX | `RunDetailExportRecordCompareCallout.tsx`, `ArchitectureComparisonReplayCostSection.tsx`, `GovernanceAssignedToMeCountBlockedCallout.tsx` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave123ArchitectureTests.cs`.

**Hasher baseline note:** wave 123 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** wave 56 runs package export and governance dashboard follow-ups — see [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE124.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE124.md) (1473–1484) when opened.
