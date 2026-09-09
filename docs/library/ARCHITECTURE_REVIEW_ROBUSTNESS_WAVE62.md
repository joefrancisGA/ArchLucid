> **Scope:** Contributor-reference — wave-62 robustness controls for architecture create and review (branch `cursor/wave62-robustness-e14f`).

# Architecture create/review robustness — wave 62

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE61.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE61.md) (717–728 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 729 | Wire run export history hook into run detail exports | `use-run-export-history-query.ts`, `RunDetailExportHistoryCallout.tsx`, `RunDetailArtifactsExportsSection.tsx` |
| 730 | Export-record comparison history hook + UI | `use-export-record-comparison-history-query.ts`, `RunDetailExportRecordComparisonHistoryCallout.tsx` |
| 731 | Wire architecture-intelligence run model hook into closed-loop UI | `use-architecture-intelligence-run-model-query.ts`, `ArchitectureIntelligenceRunModelGuardCallout.tsx`, `ArchitectureIntelligencePageClient.tsx` |
| 732 | Finding disposition history fail-closed UX | `finding-dispositions-blocked-reason.ts`, `use-finding-inspect-governance-stickiness-dispositions.ts`, `FindingInspectDispositionBlockedCallout.tsx` |
| 733 | Timelines-bundle fail-closed UX | `run-detail-timelines-bundle-blocked-reason.ts`, `load-run-detail-pipeline-timeline-cached.ts`, `RunDetailPipelineTimelineSection.tsx` |
| 734 | Stage-timeline fail-closed in progress tracker | `use-run-stage-timeline-query.ts`, `use-run-progress-tracker.ts`, `RunProgressTracker.tsx` |
| 735 | Governance stickiness summary fail-closed UX | `governance-stickiness-summary-blocked-reason.ts`, `GovernanceStickinessSummaryGuardCallout.tsx`, `ReviewsAwaitingActionCard.tsx` |
| 736 | Finding evidence-chain fail-closed UX | `finding-evidence-chain-blocked-reason.ts`, `FindingExplainPanel.tsx` |
| 737 | Authority/provenance-graph alias fail-closed UX | `authority-provenance-alias-blocked-reason.ts`, `provenance-graph-alias-blocked-reason.ts`, `GraphPageProvenanceAliasGuardCallout.tsx` |
| 738 | Manifest summary read OpenAPI **409** | `ManifestsController.Get.Summary.cs`, `ManifestsController.SealedManifestGuard.cs` |
| 739 | Run-scoped retrieval search OpenAPI **409** | `RetrievalController.cs`, `RetrievalController.SealedManifestGuard.cs` |
| 740 | End-to-end compare lifecycle hint fail-closed UX | `use-compare-runs-end-to-end-query.ts`, `FindingCrossReviewCompareBlockedCallout.tsx`, `FindingCrossReviewLifecycleHint.tsx` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave62ArchitectureTests.cs`.

**Hasher baseline note:** wave 62 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** see [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE63.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE63.md) (741–752).
