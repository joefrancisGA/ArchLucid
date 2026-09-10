<<<<<<< HEAD
> **Scope:** Contributor-reference — wave-117 robustness controls for architecture create and review (branch `cursor/wave117-robustness-e14f`).
=======
> **Scope:** Placeholder — wave-117 robustness controls (1389–1400) when opened.
>>>>>>> origin/master

# Architecture create/review robustness — wave 117

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE116.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE116.md) (1377–1388 carryover).

<<<<<<< HEAD
| # | Control | Primary wiring |
|---|---------|----------------|
| 1389 | Product source-context GET runtime **409** mapper | `ArchitectureIntelligenceController.ProductPublish.cs` — `GetProductRunSourceContextAsync` |
| 1390 | Architecture-intelligence run POST runtime **409** mapper | `ArchitectureIntelligenceController.Run.cs` — `PostRunAsync` |
| 1391 | Architecture-intelligence continue POST runtime **409** mapper | same file — `PostContinueAsync` |
| 1392 | Architecture-intelligence publish POST runtime **409** mapper | same file — `PostPublishAsync` |
| 1393 | Architecture-intelligence run model GET runtime **409** mapper | same file — `GetRunModelAsync` |
| 1394 | Run detail prefetch guard runtime **409** mapper | `ArchitectureIntelligenceController.SealedManifestGuard.cs` — `EnsureRunSealedManifestReadAllowedAsync` |
| 1395 | Architecture-intelligence sealed guard runtime **409** mapper | same file — `MapArchitectureIntelligenceSealedManifestConflict` |
| 1396 | Product source-context GET `blockedReason` | `architecture-intelligence-source-context-blocked-reason.ts` |
| 1397 | Product source-context client fail-closed | `architecture-intelligence-api-closed-loop.ts` — `fetchArchitectureIntelligenceProductSourceContext` |
| 1398 | Source-context query hook `blockedReason` | `use-architecture-intelligence-source-context-query.ts` |
| 1399 | Product context hook fail-closed UX | `use-architecture-intelligence-product-context.ts` |
| 1400 | Source-context load failure callout + API barrel | `ArchitectureIntelligenceProductContextLoadFailure.tsx`, `architecture-intelligence-api.ts` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave117ArchitectureTests.cs`.

**Hasher baseline note:** wave 117 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** wave 52 run findings and advisory read follow-ups — see [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE118.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE118.md) (1401–1412) when opened.
=======
**Deferred:** not yet opened.
>>>>>>> origin/master
