> **Scope:** Contributor-reference — wave-77 robustness controls for architecture create and review (branch `cursor/wave77-robustness-e14f`).

# Architecture create/review robustness — wave 77

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE76.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE76.md) (897–908 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 909 | Advisory recommendation apply POST OpenAPI **409** | `AdvisoryController.cs` — `ApplyRecommendationAction`; `AdvisoryController.SealedManifestGuard.cs` — `EnsureAdvisoryApplySealedManifestAllowedAsync` |
| 910 | Diagram model GET OpenAPI **409** | `ArchitectureDiagramIngestController.cs` — `GetModel`; `ArchitectureDiagramIngestController.SealedManifestGuard.cs` |
| 911 | Cloud resource evidence hub GET OpenAPI **409** | `CloudResourceEvidenceHubController.cs` — `GetHub`; `CloudResourceEvidenceHubController.SealedManifestGuard.cs` |
| 912 | Compare explain GET OpenAPI **409** | `ExplanationController.CompareHolistic.cs` — `ExplainComparison`; `ExplanationController.SealedManifestGuard.cs` |
| 913 | Review-trail provenance GET OpenAPI **409** | `AuthorityReadsController.cs` — `GetReviewTrailProvenance`; `AuthorityQueryController.Trail.cs` — `GetRunProvenance` |
| 914 | Cross-tenant portfolio GET OpenAPI **409** | `RoiController.cs` — `GetCrossTenantPortfolioSummaryAsync`; `CrossTenantPortfolioSealedManifestGuard.cs` |
| 915 | Stickiness registers + attestation OpenAPI **409** | `GovernanceStickinessController.Registers.cs`, `GovernanceStickinessController.Attestation.cs`; `EnsureRegistersSealedManifestAllowedAsync` |
| 916 | Share review / first-value Markdown `blockedReason` | `first-value-report-mutation-blocked-reason.ts`, `ShareReviewPackageButton.tsx` |
| 917 | Artifacts section request JSON + DOCX `blockedReason` | `architecture-request-json-mutation-blocked-reason.ts`, `run-package-export-mutation-blocked-reason.ts`, `RunDetailArtifactsExportsSection.tsx` |
| 918 | Sponsor collateral DOCX `blockedReason` | `run-package-export-mutation-blocked-reason.ts`, `SponsorExportsSection.tsx`, `ReviewPackageSponsorHandoffStrip.tsx` |
| 919 | Compare manifest export `blockedReason` | `manifest-compare-export-mutation-blocked-reason.ts`, `CompareResultsPanelDiffStack.tsx` |
| 920 | Diagram reconcile load-model `blockedReason` | `diagram-reconcile-load-model-blocked-reason.ts`, `DiagramReconcileWorkbenchClient.tsx` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave77ArchitectureTests.cs`.

**Hasher baseline note:** wave 77 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** none — see [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE78.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE78.md) (921–932) when opened.
