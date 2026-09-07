> **Scope:** Contributor-reference — wave-39 robustness controls for architecture create and review (branch `cursor/wave39-robustness-e14f`).

# Architecture create/review robustness — wave 39

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE38.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE38.md) (441–452 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 453 | Remediation instance **list** sealed-hash guard parity | `RemediationInstanceQueryService.ListInstancesAsync`, `RemediationInstancesController.List` |
| 454 | Compare AI explanation UI fail-closed for 409 | `CompareResultsPanelVerdictChrome`, `compare-run-pair-blocked-reason.ts` |
| 455 | Demo viewer compare lifecycle/sealed-hash → 409 | `DemoViewerController.Compare.cs`, `ICompareRunsApplicationFacade` |
| 456 | Run detail workspace-context prior-compare fail-closed | `RunDetailPageBundleController.WorkspaceContext.cs` |
| 457 | Run detail “changes since last review” compare-block UI | `load-run-detail-deferred-model.ts`, `ChangesSinceLastReviewBanner` |
| 458 | Comparison batch replay OpenAPI 409 | `ComparisonsController.Replay.cs` `ReplayComparisonsBatch` |
| 459 | Reference evidence admin export ROI freshness | `ReferenceEvidenceAdminExportService`, `PilotRunDeltasResponseMapper.ToResponseWithProofPackage` |
| 460 | Why ArchLucid sponsor pack ROI freshness UI | `WhyArchLucidSponsorPackBody.tsx` |
| 461 | Manifest detail deliverables raw bundle link UI fail-closed | `ManifestDetailDeliverablesCard.tsx` |
| 462 | Remediation workbench sealed-manifest 409 UX | `infra-evidence-sealed-manifest-conflict.ts`, `infra-evidence-remediation-api.ts` |
| 463 | Diagram reconcile sealed-hash 409 UX | `infra-evidence-sealed-manifest-conflict.ts`, `infra-evidence-diagram-reconcile-api.ts` |
| 464 | Holistic critic sealed-manifest → 409 | `ExplanationController.CompareHolistic.cs`, `SealedManifestReadGuard` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave39ArchitectureTests.cs`.

**Hasher baseline note:** wave 39 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** none.
