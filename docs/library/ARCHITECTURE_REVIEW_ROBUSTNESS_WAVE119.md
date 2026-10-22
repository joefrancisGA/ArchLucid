> **Scope:** Contributor-reference — wave-119 robustness controls for architecture create and review (branch `cursor/wave119-robustness-e14f`).

# Architecture create/review robustness — wave 119

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE118.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE118.md) (1401–1412 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 1413 | Provenance full graph GET runtime **409** mapper | `ProvenanceController.cs` — `GetFullGraph` |
| 1414 | Provenance decision subgraph GET runtime **409** mapper | same file — `GetDecisionGraph` |
| 1415 | Provenance node neighborhood GET runtime **409** mapper | same file — `GetNodeNeighborhood` |
| 1416 | Run comparison history list GET runtime **409** mapper | `ComparisonsController.History.cs` — `GetRunComparisonHistory` |
| 1417 | Comparison history search GET runtime **409** mapper | same file — `SearchComparisonRecords` |
| 1418 | Provenance sealed guard runtime **409** mapper | `ProvenanceController.SealedManifestGuard.cs` — `EnsureSealedManifestReadAllowedAsync` |
| 1419 | Comparison history sealed guard runtime **409** mapper | `ComparisonsController.SealedManifestGuard.cs` — `EnsureSealedManifestReadAllowedAsync` |
| 1420 | Provenance alias graph GET `blockedReason` | `provenance-graph-alias-blocked-reason.ts`, `graph-api.ts` — `getProvenanceGraph` |
| 1421 | Provenance alias subgraph GET `blockedReason` | same blocked-reason helper, `graph-api.ts` — `getDecisionSubgraph`, `getNodeNeighborhood` |
| 1422 | Run comparison history GET `blockedReason` | `run-comparison-history-blocked-reason.ts`, `run-comparison-history-api.ts` — `getRunComparisonHistory` |
| 1423 | Compare picked-summary hook fail-closed | `use-compare-form-fetch.ts`, `use-compare-form-diff-submit.ts` |
| 1424 | Compare picked-summary picker fail-closed UX | `CompareRunPickersSection.tsx`, `CompareForm.tsx` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave119ArchitectureTests.cs`.

**Hasher baseline note:** wave 119 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** wave 53 sponsor collateral programmatic-actions follow-ups — see [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE120.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE120.md) (1425–1436) when opened.
