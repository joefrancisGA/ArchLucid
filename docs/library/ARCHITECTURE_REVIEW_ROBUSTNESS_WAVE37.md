> **Scope:** Contributor-reference — wave-37 robustness controls for architecture create and review (branch `cursor/wave37-robustness-e14f`).

# Architecture create/review robustness — wave 37

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE36.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE36.md) (417–428 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 429 | Compare run-pair load lifecycle fail-closed | `CompareRunsApplicationFacade.LoadScopedRunPairAsync`, `ScopedRunPairLoadOutcome` |
| 430 | Agent/E2E compare lifecycle → 409 | `RunComparisonController.Agents`, `EndToEndReplayComparisonService`, `ComparisonBatchReplayPinInventoryGuard` |
| 431 | Diagram reconciliation GET sealed-hash guard | `DiagramInfrastructureReconciliationService.TryGetReconciliationAsync` |
| 432 | Diagram reconciliation 409 mapping | `ArchitectureDiagramReconciliationController` |
| 433 | Vision diagram ingest 409 mapping | `ArchitectureDiagramVisionIngestController` |
| 434 | Drift diff narrative POST 409 | `InfraEvidenceInventoryController.BuildNarrative`, `AzureInventoryDiffNarrativeService` |
| 435 | Sponsor proof pack ZIP 409 | `PilotsController.GetSponsorProofPackZip` |
| 436 | First-value report GET 409 | `PilotsController.GetFirstValueReport` |
| 437 | Sponsor one-pager PDF 409 | `PilotsController.PostSponsorOnePager` |
| 438 | Comparison replay complexity warnings-only | `ComparisonReplayPayloadComplexity.ManifestDiff` |
| 439 | Sponsor evidence pack ROI freshness honesty | `SponsorEvidencePackService`, `PilotRunDeltasResponseMapper.ToResponseWithProofPackage` |
| 440 | Remediation instance read sealed-hash guard | `RemediationInstanceQueryService.TryGetInstanceAsync`, `RemediationInstancesController.Get` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave37ArchitectureTests.cs`.

**Hasher baseline note:** wave 37 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** none.
