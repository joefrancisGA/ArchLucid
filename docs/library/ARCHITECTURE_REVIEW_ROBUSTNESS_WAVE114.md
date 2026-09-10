> **Scope:** Contributor-reference — wave-114 robustness controls for architecture create and review (branch `cursor/wave114-robustness-e14f`).

# Architecture create/review robustness — wave 114

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE113.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE113.md) (1341–1352 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 1353 | Architecture graph full GET runtime **409** mapper | `GraphController.ReviewGraph.cs` — `GetArchitectureGraph` |
| 1354 | Architecture graph nodes page GET runtime **409** mapper | same file — `GetArchitectureGraphNodesPage` |
| 1355 | Architecture graph temporal snapshot GET runtime **409** mapper | `GraphController.Snapshot.cs` — `GetArchitectureGraphTemporalSnapshot` |
| 1356 | Interactive graph snapshot GET runtime **409** mapper | `RunQueryController.Provenance.cs` — `GetInteractiveGraphSnapshot` |
| 1357 | Run decisions GET runtime **409** mapper | same file — `GetRunDecisions` |
| 1358 | Run evidence GET runtime **409** mapper | same file — `GetRunEvidence` |
| 1359 | Graph sealed guard runtime **409** mapper | `GraphController.SealedManifestGuard.cs` — `MapGraphSealedManifestConflict` |
| 1360 | Architecture graph full GET `blockedReason` | `architecture-graph-temporal-snapshot-blocked-reason.ts`, `graph-api.ts` — `getArchitectureGraph` |
| 1361 | Architecture graph nodes page GET `blockedReason` | same blocked-reason helper, `graph-api.ts` — `getArchitectureGraphPage` |
| 1362 | Paginated graph merge `blockedReason` | `graph-api.ts` — `mergeArchitectureGraphPages` (via `getArchitectureGraphPage`) |
| 1363 | Temporal snapshot GET `blockedReason` | same blocked-reason helper, `graph-api.ts` — `getArchitectureGraphTemporalSnapshot` |
| 1364 | Evidence graph architecture-mode fail-closed UX | `load-architecture-graph-view-model.ts`, `use-graph-page-fetch.ts`, `GraphBuyerEvidenceTrailError.tsx` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave114ArchitectureTests.cs`.

**Hasher baseline note:** wave 114 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** wave 50 sponsor summary export anchor consolidation completed in wave 115 — see [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE115.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE115.md) (1365–1376).
