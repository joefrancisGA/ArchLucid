> **Scope:** Contributor-reference — wave-130 robustness controls for architecture create and review (branch `cursor/wave130-robustness-e14f`).

# Architecture create/review robustness — wave 130

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE129.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE129.md) (1533–1544 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 1545 | Wire run export history hook into run detail exports | `use-run-export-history-query.ts`, `RunDetailExportHistoryCallout.tsx`, `RunDetailArtifactsExportsSection.tsx` |
| 1546 | Export-record comparison history hook + UI | `use-export-record-comparison-history-query.ts`, `RunDetailExportRecordComparisonHistoryCallout.tsx` |
| 1547 | Wire architecture-intelligence run model hook into closed-loop UI | `use-architecture-intelligence-run-model-query.ts`, `ArchitectureIntelligenceRunModelGuardCallout.tsx`, `ArchitectureIntelligencePageClient.tsx` |
| 1548 | Finding disposition history fail-closed UX | `finding-dispositions-blocked-reason.ts`, `use-finding-inspect-governance-stickiness-dispositions.ts`, `FindingInspectDispositionBlockedCallout.tsx` |
| 1549 | Timelines-bundle fail-closed UX | `run-detail-timelines-bundle-blocked-reason.ts`, `load-run-detail-pipeline-timeline-cached.ts`, `RunDetailPipelineTimelineSection.tsx` |
| 1550 | Stage-timeline fail-closed in progress tracker | `use-run-stage-timeline-query.ts`, `use-run-progress-tracker.ts`, `RunProgressTracker.tsx` |
| 1551 | Governance stickiness summary fail-closed UX | `governance-stickiness-summary-blocked-reason.ts`, `GovernanceStickinessSummaryGuardCallout.tsx`, `ReviewsAwaitingActionCard.tsx` |
| 1552 | Finding evidence-chain fail-closed UX | `finding-evidence-chain-blocked-reason.ts`, `FindingExplainPanel.tsx` |
| 1553 | Authority/provenance-graph alias fail-closed UX | `authority-provenance-alias-blocked-reason.ts`, `provenance-graph-alias-blocked-reason.ts`, `GraphPageProvenanceAliasGuardCallout.tsx` |
| 1554 | Manifest summary read runtime **409** mapper | `ManifestsController.Get.Summary.cs`, `ManifestsController.SealedManifestGuard.cs` |
| 1555 | Run-scoped retrieval search runtime **409** mapper | `RetrievalController.cs`, `RetrievalController.SealedManifestGuard.cs` — `Search` |
| 1556 | End-to-end compare lifecycle hint fail-closed UX | `use-compare-runs-end-to-end-query.ts`, `FindingCrossReviewCompareBlockedCallout.tsx`, `FindingCrossReviewLifecycleHint.tsx` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave130ArchitectureTests.cs`.

**Hasher baseline note:** wave 130 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** see [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE131.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE131.md) (1557–1568) for wave-63 follow-ups (741–752).
