> **Scope:** Contributor-reference — wave-63 robustness controls for architecture create and review (branch `cursor/wave63-robustness-e14f`).

# Architecture create/review robustness — wave 63

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE62.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE62.md) (729–740 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 741 | Finding feedback POST OpenAPI **409** (dual routes) | `FindingFeedbackController.cs`, `FindingFeedbackController.SealedManifestGuard.cs`, `RunsController.FindingFeedback.cs`, `RunsController.SealedManifestGuard.cs` |
| 742 | Standalone finding inspect GET **409** | `FindingInspectController.cs`, `FindingInspectController.SealedManifestGuard.cs` |
| 743 | Advisory recommendation action POST **409** | `AdvisoryController.cs` (`ConflictException` from `AdvisoryApplySealedManifestHashGuard`) |
| 744 | Assigned-to-me count sealed register hook + UX | `use-assigned-to-me-findings-count-query.ts`, `GovernanceAssignedToMeCountBlockedCallout.tsx`, `GovernanceAssignedToMeFindingsNavBadge.tsx` |
| 745 | Finding LLM audit fail-closed hook + debug panel | `finding-llm-audit-blocked-reason.ts`, `use-finding-llm-audit-query.ts`, `FindingInspectLlmAuditBlockedCallout.tsx`, `FindingInspectContextDebugPanel.tsx` |
| 746 | Temporal graph snapshot fail-closed UX | `ArchitectureGraphViewer.tsx`, `ArchitectureGraphTemporalSnapshotGuardCallout.tsx`, `architecture-graph-temporal-snapshot-blocked-reason.ts` |
| 747 | Run retrieval grounding hook `blockedReason` | `use-run-retrieval-grounding-query.ts`, `RunDetailRetrievalGroundingSection.tsx` |
| 748 | Run explanation summary deferred load fail-closed | `load-run-detail-explanation-summary.ts`, `RunDetailRunExplanationCollapsible.tsx` |
| 749 | Architecture seal-delta query `blockedReason` | `use-architecture-seal-delta-query.ts`, `ArchitectureSealDeltaPanel.tsx` |
| 750 | Advisory recommendations bootstrap fail-closed UX | `use-advisory-scans-content.ts`, `AdvisoryScansContent.tsx`, `use-advisory-recommendations-query.ts` |
| 751 | Evidence trail trace panel explanation fail-closed | `EvidenceTrailTracePanel.tsx`, `explain-run-blocked-reason.ts` |
| 752 | Sealed-records list + compare-fallback fail-closed | `enrich-signed-records-list-rows.ts`, `use-prior-same-request-compare-fallback-query.ts`, `PriorSameRequestCompareFallbackBlockedCallout.tsx` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave63ArchitectureTests.cs`.

**Hasher baseline note:** wave 63 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** none.
