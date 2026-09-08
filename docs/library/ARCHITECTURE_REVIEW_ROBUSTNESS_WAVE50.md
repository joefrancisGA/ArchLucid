> **Scope:** Contributor-reference — wave-50 robustness controls for architecture create and review (branch `cursor/wave50-robustness-e14f`).

# Architecture create/review robustness — wave 50

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE49.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE49.md) (573–584 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 585 | Timelines bundle read OpenAPI **409** | `RunDetailPageBundleController.Timelines.cs`, `RunDetailPageBundleController.SealedManifestGuard.cs` |
| 586 | Review-trail / pipeline-timeline / rationale reads OpenAPI **409** | `AuthorityReadsController.cs` (`GetReviewTrail`, `GetReviewTrailRationale`), `AuthorityQueryController.Trail.cs` (`GetRunPipelineTimeline`, `GetRunRationale`) |
| 587 | Technology ledger read OpenAPI **409** | `TechnologyLedgerController.cs` |
| 588 | Clarification-questions read OpenAPI **409** | `ReviewClarificationQuestionsController.cs` |
| 589 | Run coverage reads OpenAPI **409** | `RunCoverageController.cs`, `RunCoverageController.Acknowledgement.cs` |
| 590 | Stage timeline + coordinator subgraph reads OpenAPI **409** | `RunQueryController.Detail.cs` (`GetRunStageTimeline`), `RunQueryController.Provenance.cs` (`GetRunDecisions`, `GetRunEvidence`, `GetInteractiveGraphSnapshot`), `GraphController.Snapshot.cs` (`GetArchitectureGraphTemporalSnapshot`) |
| 591 | Timelines bundle client sealed reads | `fetch-run-detail-page-bundle-client.ts`, `run-detail-timelines-bundle-blocked-reason.ts` |
| 592 | Pipeline + stage timeline client sealed reads | `architecture-runs-read-list.ts`, `run-pipeline-timeline-blocked-reason.ts`, `load-run-detail-pipeline-timeline-cached.ts`, `RunDetailPipelineTimelineSection.tsx` |
| 593 | Technology ledger + clarification client sealed reads | `technology-ledger.ts`, `review-clarification-questions-api.ts`, blocked-reason files, `TechnologyBaselinePanel.tsx`, `use-review-clarification-questions.ts`, `ArchitectureCreatedClarificationsPanel.tsx` |
| 594 | Evidence graph paging + temporal snapshot client sealed reads | `graph-api.ts` (`getArchitectureGraphPage`, `getArchitectureGraphTemporalSnapshot`, `mergeArchitectureGraphPages`) |
| 595 | Below-fold fail-closed UX for new blocked reads | pipeline timeline section, technology baseline, clarification panels |
| 596 | Sponsor summary export anchor consolidation | `downloads-blob-trigger-run-summary-export.ts`, `RunDetailPageHeader.tsx`, `run-summary-export-api.ts` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave50ArchitectureTests.cs`.

**Hasher baseline note:** wave 50 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** see [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE51.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE51.md) (597–608).
