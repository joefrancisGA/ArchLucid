> **Scope:** Contributor-reference — wave-131 robustness controls for architecture create and review (branch `cursor/wave131-robustness-e14f`).

# Architecture create/review robustness — wave 131

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE130.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE130.md) (1545–1556 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 1557 | Finding feedback POST runtime **409** (dual routes) | `FindingFeedbackController.cs`, `RunsController.FindingFeedback.cs` — `PostFindingFeedbackAsync` |
| 1558 | Standalone finding inspect GET runtime **409** mapper | `FindingInspectController.cs`, `FindingInspectController.SealedManifestGuard.cs` — `GetInspectAsync` |
| 1559 | Advisory recommendation action POST runtime **409** mapper | `AdvisoryController.cs` — `ApplyRecommendationAction` |
| 1560 | Assigned-to-me count sealed register hook + UX | `use-assigned-to-me-findings-count-query.ts`, `GovernanceAssignedToMeCountBlockedCallout.tsx`, `GovernanceAssignedToMeFindingsNavBadge.tsx` |
| 1561 | Finding LLM audit fail-closed hook + debug panel | `finding-llm-audit-blocked-reason.ts`, `use-finding-llm-audit-query.ts`, `FindingInspectLlmAuditBlockedCallout.tsx`, `FindingInspectContextDebugPanel.tsx` |
| 1562 | Temporal graph snapshot fail-closed UX | `ArchitectureGraphViewer.tsx`, `ArchitectureGraphTemporalSnapshotGuardCallout.tsx` |
| 1563 | Run retrieval grounding hook `blockedReason` | `use-run-retrieval-grounding-query.ts`, `RunDetailRetrievalGroundingSection.tsx` |
| 1564 | Run explanation summary deferred load fail-closed | `load-run-detail-explanation-summary.ts`, `RunDetailRunExplanationCollapsible.tsx` |
| 1565 | Architecture seal-delta query `blockedReason` | `architecture-seal-delta-api.ts`, `use-architecture-seal-delta-query.ts`, `ArchitectureSealDeltaPanel.tsx` |
| 1566 | Advisory recommendations bootstrap fail-closed UX | `use-advisory-scans-content.ts`, `AdvisoryScansContent.tsx`, `use-advisory-recommendations-query.ts` |
| 1567 | Evidence trail trace panel explanation fail-closed | `EvidenceTrailTracePanel.tsx`, `explain-run-blocked-reason.ts` |
| 1568 | Sealed-records list + compare-fallback fail-closed | `enrich-signed-records-list-rows.ts`, `use-prior-same-request-compare-fallback-query.ts`, `PriorSameRequestCompareFallbackBlockedCallout.tsx` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave131ArchitectureTests.cs`.

**Hasher baseline note:** wave 131 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** see [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE132.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE132.md) (1569–1580) for wave-64 follow-ups (753–764).
