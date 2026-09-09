> **Scope:** Contributor-reference — wave-60 robustness controls for architecture create and review (branch `cursor/wave60-robustness-e14f`).

# Architecture create/review robustness — wave 60

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE59.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE59.md) (693–704 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 705 | Governance posture read OpenAPI **409** | `GovernancePostureController.cs`, `GovernancePostureController.SealedManifestGuard.cs` |
| 706 | Architecture seal-delta read OpenAPI **409** | `ArchitecturesController.cs`, `ArchitecturesController.SealedManifestGuard.cs`, `ArchitectureSealDeltaSealedManifestReadGuard.cs` |
| 707 | Export-record replay read OpenAPI **409** | `ExportsController.cs`, `ExportsController.SealedManifestGuard.cs` |
| 708 | Authority run inventory list read OpenAPI **409** | `AuthorityReadsController.cs`, `AuthorityQueryController.List.cs`, `RunInventorySealedManifestReadGuard.cs` |
| 709 | Governance preview read OpenAPI **409** | `GovernancePreviewController.cs`, `GovernancePreviewController.SealedManifestGuard.cs` |
| 710 | Governance coverage preview POST OpenAPI **409** | `GovernanceCoverageController.cs`, `GovernanceCoveragePreviewSealedManifestHashGuard.cs` |
| 711 | Reviews hub list sealed client + blocked-reason | `architecture-runs-list.ts`, `run-list-blocked-reason.ts`, `load-runs-page-model.ts`, `RunsPageView.tsx` |
| 712 | Draft intake GET sealed client + fail-closed hook | `draft-intake-api-crud.ts`, `use-architecture-draft-query.ts`, `architecture-draft-blocked-reason.ts` |
| 713 | Wire export-record compare hook into run detail exports | `RunDetailExportRecordCompareCallout.tsx`, `RunDetailArtifactsExportsSection.tsx` |
| 714 | Wire comparison search + drift download fail-closed UX | `use-compare-results-panel.ts`, `use-comparison-drift-download.ts`, `CompareResultsPanel.tsx` |
| 715 | Wire approval rationale hook into approval lineage UI | `GovernanceApprovalLineageDetailContent.tsx`, `use-governance-approval-rationale-query.ts` |
| 716 | Wire realized-value attestation into governance KPI surfaces | `use-governance-overview-load-state.ts`, `SponsorRoiDashboardLiveKpiCards.tsx` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave60ArchitectureTests.cs`.

**Hasher baseline note:** wave 60 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** none.