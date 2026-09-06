> **Scope:** Contributor-reference — wave-38 robustness controls for architecture create and review (branch `cursor/wave38-robustness-e14f`).

# Architecture create/review robustness — wave 38

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE37.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE37.md) (429–440 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 441 | Legacy authority compare run-pair lifecycle fail-closed | `AuthorityCompareController.CompareRuns`, `ICompareRunsApplicationFacade.LoadScopedRunPairAsync` |
| 442 | Legacy authority compare sealed-hash + pin/inventory guards | `AuthorityCompareController.MapScopedRunPairLoadOutcome` |
| 443 | Legacy authority compare maps lifecycle/hash conflicts → 409 | `AuthorityCompareController.CompareRuns` |
| 444 | Remediation mutations map sealed-hash conflicts → HTTP 409 | `RemediationInstancesController.MapOperationResult` |
| 445 | Remediation mutation endpoints declare `ProducesResponseType(409)` | `RemediationInstancesController` POST routes |
| 446 | Structured compare OpenAPI 409 declaration | `ComparisonController.CompareRuns` |
| 447 | Manifest version compare OpenAPI 409 declarations | `ManifestsController.Compare.cs` |
| 448 | Sponsor review packet GET OpenAPI 409 declaration | `PilotsController.GetExecutiveReviewPacket` |
| 449 | Compare-two-reviews UI fail-closed for compare 409 | `compare-run-pair-blocked-reason.ts`, `CompareResultsPanelVerdictChrome` |
| 450 | Buyer manifest deliverable grid UI fail-closed | `ManifestDeliverableGrid` |
| 451 | Buyer manifest bundle ZIP UI fail-closed | `ManifestBuyerBundleDownloadSection` |
| 452 | Buyer manifest summary bundle ZIP UI fail-closed | `ManifestDetailSummaryBundleDownload` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave38ArchitectureTests.cs`.

**Hasher baseline note:** wave 38 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** none.
