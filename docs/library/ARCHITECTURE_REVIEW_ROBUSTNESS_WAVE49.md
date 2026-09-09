> **Scope:** Contributor-reference — wave-49 robustness controls for architecture create and review (branch `cursor/wave49-robustness-e14f`).

# Architecture create/review robustness — wave 49

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE48.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE48.md) (561–572 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 573 | Critical page bundle read OpenAPI **409** | `RunDetailPageBundleController.Critical.cs`, `RunDetailPageBundleController.SealedManifestGuard.cs` |
| 574 | Full run detail + buyer-summary read OpenAPI **409** | `AuthorityReadsController.cs`, `AuthorityQueryController.RunDetail.cs` |
| 575 | Workspace-context bundle read OpenAPI **409** | `RunDetailPageBundleController.WorkspaceContext.cs` |
| 576 | Evidence graph read OpenAPI **409** | `GraphController.ReviewGraph.cs` |
| 577 | Governance findings registers read OpenAPI **409** | `GovernanceStickinessController.Registers.cs`, `GovernanceStickinessFacade.RegistersSealedManifestGuard.cs` |
| 578 | Page bundle client sealed reads + fail-closed UX | `fetch-run-detail-page-bundle-client.ts`, `run-detail-page-bundle-blocked-reason.ts`, `RunDetailPageFetchErrorView.tsx` |
| 579 | Run detail + buyer-summary client sealed reads | `architecture-runs-read-detail-artifacts.ts`, `architecture-runs-read-list.ts` |
| 580 | Evidence graph client sealed reads + fail-closed UX | `graph-api.ts`, `evidence-graph-blocked-reason.ts`, `GraphBuyerEvidenceTrailError.tsx` |
| 581 | Governance registers client sealed reads | `governance-stickiness-api-registers.ts`, `governance-registers-blocked-reason.ts`, `governance-findings-query-fetch.ts`, `use-architecture-decision-register-query.ts` |
| 582 | Workspace context / changes-since-last-review fail-closed UX | `load-run-detail-deferred-model.ts`, `RunDetailMidDeferredSections.tsx` |
| 583 | Export anchor consolidation (request JSON + draft receipt) | `RunDetailArtifactsExportsSection.tsx`, `DecisionReceiptExportButton.tsx`, `downloads-blob-trigger-architecture-request.ts`, `downloads-blob-trigger-draft-decision-receipt.ts` |
| 584 | Pilot collateral + retrieval JSON link consolidation | `RunDetailAiReadinessGateCard.tsx`, `RunRetrievalGroundingSummaryCard.tsx`, `downloads-blob-trigger-retrieval-grounding-json.ts` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave49ArchitectureTests.cs`.

**Hasher baseline note:** wave 49 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** see [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE50.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE50.md) (585–596).
