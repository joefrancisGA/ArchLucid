> **Scope:** Contributor-reference — wave-51 robustness controls for architecture create and review (branch `cursor/wave51-robustness-e14f`).

# Architecture create/review robustness — wave 51

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE50.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE50.md) (585–596 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 597 | Architecture run detail read OpenAPI **409** | `RunQueryController.Detail.cs` (`GetRun`), `AuthorityQueryController.RunDetail.cs` (`GetRunDetail` obsolete alias) |
| 598 | Run summary read OpenAPI **409** | `AuthorityQueryController.RunDetail.cs` (`GetRunSummary`) |
| 599 | Run summary SSE OpenAPI **409** | `AuthorityRunEventsController.cs` (`GetRunEvents`) |
| 600 | Run ROI estimate read OpenAPI **409** | `RunQueryController.Detail.cs` (`GetRunRoiEstimate`) |
| 601 | Architecture-intelligence source-context read OpenAPI **409** | `ArchitectureIntelligenceController.ProductPublish.cs` (`GetProductRunSourceContextAsync`) |
| 602 | `getRunSummary` sealed reads + blocked reason | `architecture-runs-read-list.ts`, new `run-summary-blocked-reason.ts`, `use-run-summary-query.ts` |
| 603 | Run detail client canonical guarded path | `architecture-runs-read-detail-artifacts.ts` (`getRunDetail` → `/v1/runs/{id}` with apiGetSealedManifestAware) |
| 604 | Compare/progress sealed summary + fail-closed UX | `use-compare-form-fetch.ts`, `useRunSummaryStream.ts`, `RunProgressTracker.tsx`, `CommitRunButton.tsx` + run-summary-blocked-reason |
| 605 | Architecture-intelligence client sealed reads + UX | `architecture-intelligence-api-closed-loop.ts`, `use-architecture-intelligence-source-context-query.ts`, new blocked-reason, `use-architecture-intelligence-product-context.ts` |
| 606 | Sponsor ROI CSV programmatic export | new `downloads-blob-trigger-sponsor-roi-csv-export.ts`, `SponsorRoiSummarySection.tsx`, update `fetch-sponsor-roi-summary-client.ts` if needed |
| 607 | Manifest compare export programmatic download | new `downloads-blob-trigger-manifest-compare-export.ts`, wire into compare UI (`CompareRawManifestDiffSection.tsx` or `CompareResultsPanelDiffStack.tsx`) |
| 608 | Sponsor collateral dead proxy cleanup + traceability URL parity | `use-email-run-to-sponsor-banner.ts`, `EmailRunToSponsorExportActions.tsx`, `downloads-blob-urls.ts` traceability canonical path |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave51ArchitectureTests.cs`.

**Hasher baseline note:** wave 51 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** none.
