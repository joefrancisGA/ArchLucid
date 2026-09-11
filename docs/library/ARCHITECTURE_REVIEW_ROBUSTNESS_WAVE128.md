> **Scope:** Contributor-reference — wave-128 robustness controls for architecture create and review (branch `cursor/wave128-robustness-e14f`).

# Architecture create/review robustness — wave 128

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE127.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE127.md) (1509–1520 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 1521 | Governance posture read runtime **409** mapper | `GovernancePostureController.cs`, `GovernancePostureController.SealedManifestGuard.cs` — `GetPosture` |
| 1522 | Architecture seal-delta read runtime **409** mapper | `ArchitecturesController.cs`, `ArchitecturesController.SealedManifestGuard.cs` — `GetSealDelta` |
| 1523 | Export-record replay read runtime **409** mapper | `ExportsController.cs`, `ExportsController.SealedManifestGuard.cs` — `ReplayExportRecord` |
| 1524 | Run inventory list runtime **409** mapper | `AuthorityReadsController.cs`, `AuthorityQueryController.List.cs`, `RunInventorySealedManifestReadGuard.cs` |
| 1525 | Governance preview read runtime **409** mapper | `GovernancePreviewController.cs`, `GovernancePreviewController.SealedManifestGuard.cs` |
| 1526 | Governance coverage preview POST runtime **409** mapper | `GovernanceCoverageController.cs` — `PreviewCoverage` |
| 1527 | Reviews hub list `apiGet` + `runListBlockedReason` | `architecture-runs-list.ts`, `run-list-blocked-reason.ts`, `load-runs-page-model.ts`, `RunsPageView.tsx` |
| 1528 | Draft intake GET `apiGet` + `architectureDraftBlockedReason` | `draft-intake-api-crud.ts`, `use-architecture-draft-query.ts`, `architecture-draft-blocked-reason.ts` |
| 1529 | Wire export-record compare hook into run detail exports | `RunDetailExportRecordCompareCallout.tsx`, `RunDetailArtifactsExportsSection.tsx` |
| 1530 | Wire comparison search + drift download fail-closed UX | `use-compare-results-panel.ts`, `use-comparison-drift-download.ts`, `CompareResultsPanel.tsx` |
| 1531 | Wire approval rationale hook into approval lineage UI | `GovernanceApprovalLineageDetailContent.tsx`, `use-governance-approval-rationale-query.ts` |
| 1532 | Wire realized-value attestation into governance KPI surfaces | `use-governance-overview-load-state.ts`, `SponsorRoiDashboardLiveKpiCards.tsx` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave128ArchitectureTests.cs`.

**Hasher baseline note:** wave 128 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** see [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE129.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE129.md) (1533–1544).
