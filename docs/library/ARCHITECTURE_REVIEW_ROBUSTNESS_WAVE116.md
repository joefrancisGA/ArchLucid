> **Scope:** Contributor-reference — wave-116 robustness controls for architecture create and review (branch `cursor/wave116-robustness-e14f`).

# Architecture create/review robustness — wave 116

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE115.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE115.md) (1365–1376 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 1377 | Canonical run detail GET runtime **409** mapper | `AuthorityReadsController.cs` — `GetRunDetail` |
| 1378 | Product run aggregate GET runtime **409** mapper | `RunQueryController.Detail.cs` — `GetRun` |
| 1379 | Run ROI estimate GET runtime **409** mapper | same file — `GetRunRoiEstimate` |
| 1380 | Legacy authority run detail GET runtime **409** mapper | `AuthorityQueryController.RunDetail.cs` — `GetRunDetail` |
| 1381 | Buyer run detail summary GET runtime **409** mapper | same file — `GetBuyerRunDetailSummary` |
| 1382 | Run summary SSE runtime **409** mapper | `AuthorityRunEventsController.cs` — `GetRunEvents` |
| 1383 | Run summary GET runtime **409** mapper | `AuthorityQueryController.RunDetail.cs` — `GetRunSummary` |
| 1384 | Canonical run detail GET `blockedReason` | `run-detail-blocked-reason.ts` |
| 1385 | Canonical run detail client fail-closed | `architecture-runs-read-detail-artifacts.ts` — `getRunDetail` |
| 1386 | Run summary query hook `blockedReason` | `run-summary-blocked-reason.ts`, `use-run-summary-query.ts` |
| 1387 | Run summary SSE stream sealed fail-closed | `useRunSummaryStream.ts` — probe `getRunSummary` on SSE error |
| 1388 | Compare/progress/commit fail-closed UX | `use-compare-form-fetch.ts`, `RunProgressTracker.tsx`, `CommitRunButton.tsx` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave116ArchitectureTests.cs`.

**Hasher baseline note:** wave 116 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** wave 51 architecture-intelligence source-context client follow-ups — see [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE117.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE117.md) (1389–1400) when opened.
