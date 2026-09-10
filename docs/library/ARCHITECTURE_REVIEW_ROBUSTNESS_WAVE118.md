> **Scope:** Contributor-reference — wave-118 robustness controls for architecture create and review (branch `cursor/wave118-robustness-e14f`).

# Architecture create/review robustness — wave 118

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE117.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE117.md) (1389–1400 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 1401 | Run findings list GET runtime **409** mapper | `RunQueryController.Findings.cs` — `ListRunFindings` |
| 1402 | Run findings CSV export GET runtime **409** mapper | same file — `ExportRunFindingsCsv` |
| 1403 | Advisory improvements GET runtime **409** mapper | `AdvisoryController.cs` — `GetImprovements` |
| 1404 | Advisory recommendations list GET runtime **409** mapper | same file — `ListRecommendations` |
| 1405 | Architecture request GET runtime **409** mapper | `RunsController.ArchitectureRequests.cs` — `GetRequest` |
| 1406 | Advisory sealed guard runtime **409** mapper | `AdvisoryController.SealedManifestGuard.cs` — `MapAdvisorySealedManifestConflict` |
| 1407 | Architecture request sealed guard runtime **409** mapper | `RunsController.SealedManifestGuard.cs` — `MapRunsSealedManifestConflict` |
| 1408 | Architecture request GET `blockedReason` | `architecture-request-blocked-reason.ts`, `architecture-runs-read-list.ts` — `getArchitectureRequest` |
| 1409 | Advisory recommendations list `blockedReason` | `advisory-run-read-blocked-reason.ts`, `advisory-api.ts` — `listRecommendations` |
| 1410 | Advisory improvements plan `blockedReason` | same blocked-reason helper, `learning-evolution-api.ts` — `getImprovementPlan` |
| 1411 | Architecture/advisory query hook `blockedReason` | `use-architecture-request-query.ts`, `use-advisory-recommendations-query.ts` |
| 1412 | Advisory scans bootstrap fail-closed UX | `AdvisoryScansContent.tsx`, `use-advisory-scans-content.ts` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave118ArchitectureTests.cs`.

**Hasher baseline note:** wave 118 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** wave 52 provenance alias and compare picked-summary follow-ups — see [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE119.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE119.md) (1413–1424) when opened.
