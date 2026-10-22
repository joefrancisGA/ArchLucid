> **Scope:** Contributor-reference — wave-121 robustness controls for architecture create and review (branch `cursor/wave121-robustness-e14f`).

# Architecture create/review robustness — wave 121

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE120.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE120.md) (1425–1436 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 1437 | Run export history GET runtime **409** mapper | `ExportsController.cs` — `GetRunExportHistory` |
| 1438 | Export record GET runtime **409** mapper | same file — `GetExportRecord` |
| 1439 | Export-record comparison history GET runtime **409** mapper | `ComparisonsController.History.cs` — `GetExportRecordComparisonHistory` |
| 1440 | Comparison record GET runtime **409** mapper | same file — `GetComparisonRecord` |
| 1441 | Comparison summary GET runtime **409** mapper | same file — `GetComparisonSummary` |
| 1442 | Export sealed guard runtime **409** mapper | `ExportsController.SealedManifestGuard.cs` — `EnsureSealedManifestReadAllowedAsync` |
| 1443 | Authority provenance query sealed guard runtime **409** mapper | `ProvenanceQueryController.SealedManifestGuard.cs` — `EnsureSealedManifestReadAllowedAsync` |
| 1444 | Run export history GET `blockedReason` | `run-export-history-blocked-reason.ts`, `run-export-history-api.ts` — `getRunExportHistory` |
| 1445 | Export-record comparison history GET `blockedReason` | `export-record-comparison-history-blocked-reason.ts`, `export-record-comparison-api.ts` |
| 1446 | Authority provenance alias GET `blockedReason` | `authority-provenance-alias-blocked-reason.ts`, `authority-provenance-query-api.ts` |
| 1447 | Review-trail provenance GET `blockedReason` | `run-provenance-blocked-reason.ts`, `architecture-runs-read-detail-artifacts.ts` — `getRunProvenance` |
| 1448 | Export history + comparison history fail-closed UX | `RunDetailExportHistoryCallout.tsx`, `RunDetailExportRecordComparisonHistoryCallout.tsx`, `GraphPageProvenanceAliasGuardCallout.tsx` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave121ArchitectureTests.cs`.

**Hasher baseline note:** wave 121 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** wave 54 governance workflow and review-trail export follow-ups — see [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE122.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE122.md) (1449–1460) when opened.
