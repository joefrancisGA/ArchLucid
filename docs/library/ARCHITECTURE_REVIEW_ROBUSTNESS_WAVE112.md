> **Scope:** Contributor-reference — wave-112 robustness controls for architecture create and review (branch `cursor/wave112-robustness-e14f`).

# Architecture create/review robustness — wave 112

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE111.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE111.md) (1317–1328 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 1329 | Critical page bundle GET runtime **409** mapper | `RunDetailPageBundleController.Critical.cs` — `GetCriticalPageBundle` |
| 1330 | Timelines bundle GET runtime **409** mapper | `RunDetailPageBundleController.Timelines.cs` — `GetTimelinesBundle` |
| 1331 | Workspace context bundle GET runtime **409** mapper | `RunDetailPageBundleController.WorkspaceContext.cs` — `GetWorkspaceContextBundle` |
| 1332 | Run summary GET runtime **409** mapper | `AuthorityQueryController.RunDetail.cs` — `GetRunSummary` |
| 1333 | Legacy run detail GET runtime **409** mapper | same file — `GetRunDetail` |
| 1334 | Buyer run detail summary GET runtime **409** mapper | same file — `GetBuyerRunDetailSummary` |
| 1335 | Retrieval grounding GET runtime **409** mapper | same file — `GetRunRetrievalGrounding` |
| 1336 | Timelines bundle fetch `blockedReason` | `run-detail-timelines-bundle-blocked-reason.ts`, `fetch-run-detail-page-bundle-client.ts` — `fetchRunDetailTimelinesBundle` |
| 1337 | Workspace context bundle fetch `blockedReason` | `run-detail-page-bundle-blocked-reason.ts`, same client — `fetchRunDetailWorkspaceContextBundle` |
| 1338 | Run summary GET `blockedReason` | `run-summary-blocked-reason.ts`, `architecture-runs-read-list.ts` — `getRunSummary` |
| 1339 | Buyer run detail summary GET `blockedReason` | `buyer-run-detail-summary-blocked-reason.ts`, `architecture-runs-read-list.ts` — `getBuyerRunDetailSummary` |
| 1340 | Retrieval grounding GET `blockedReason` | `run-retrieval-grounding-blocked-reason.ts`, `architecture-runs-read-detail-artifacts.ts` — `getRunRetrievalGrounding` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave112ArchitectureTests.cs`.

**Hasher baseline note:** wave 112 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** wave 86 technology ledger and clarification follow-ups completed in wave 113 — see [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE113.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE113.md) (1341–1352).
