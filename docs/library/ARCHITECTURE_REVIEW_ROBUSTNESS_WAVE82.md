> **Scope:** Contributor-reference — wave-82 robustness controls for architecture create and review (branch `cursor/wave82-robustness-e14f`).

# Architecture create/review robustness — wave 82

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE81.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE81.md) (957–968 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 969 | Ask POST/stream OpenAPI **409** guard partial | `AskController.cs`; `AskController.SealedManifestGuard.cs` — `MapAskSealedManifestConflict` |
| 970 | Finding-ask POST OpenAPI **409** guard partial | `ArchitectureFindingAskController.cs`; `ArchitectureFindingAskController.SealedManifestGuard.cs` — `MapFindingAskSealedManifestConflict` |
| 971 | Authority compare manifests GET OpenAPI **409** guard partial | `AuthorityCompareController.cs`; `AuthorityCompareController.SealedManifestGuard.cs` — `MapCompareSealedManifestConflict` |
| 972 | Manifest markdown export GET OpenAPI **409** guard partial | `ManifestsController.Export.cs`; `ManifestsController.SealedManifestGuard.cs` — `MapGoldenManifestReadSealedManifestConflict` |
| 973 | Manifest diagram GET OpenAPI **409** guard partial | `ManifestsController.Get.Diagram.cs`; `ManifestsController.SealedManifestGuard.cs` |
| 974 | Manifest JSON/bundle GET OpenAPI **409** guard partial | `ManifestsController.Get.Manifest.cs`; `ManifestsController.SealedManifestGuard.cs` |
| 975 | Advisory digest list/detail GET OpenAPI **409** guard partial | `AdvisorySchedulingController.Digests.cs`; `AdvisorySchedulingController.SealedManifestGuard.cs` — `MapDigestSealedManifestConflict` |
| 976 | Audit CSV export `blockedReason` | `audit-export-blocked-reason.ts`, `audit-api.ts` |
| 977 | Artifact UTF-8 preview `blockedReason` | `export-record-blocked-reason.ts`, `architecture-runs-artifacts.ts` — `fetchArtifactContentUtf8` |
| 978 | Compare manifest diff load `blockedReason` | `compare-manifest-diff-blocked-reason.ts`, `resolve-architecture-manifest-json-for-diff.ts` |
| 979 | Scoped proxy download `blockedReason` | `scoped-proxy-download-blocked-reason.ts`, `downloads-blob-trigger-scoped-proxy.ts` |
| 980 | Comparison replay PDF export `blockedReason` | `comparison-replay-mutation-blocked-reason.ts`, `downloads-export-jobs.ts` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave82ArchitectureTests.cs`.

**Hasher baseline note:** wave 82 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** none — see [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE83.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE83.md) (981–992) when opened.
