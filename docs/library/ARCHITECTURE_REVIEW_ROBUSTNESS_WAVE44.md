> **Scope:** Contributor-reference — wave-44 robustness controls for architecture create and review (branch `cursor/wave44-robustness-e14f`).

# Architecture create/review robustness — wave 44

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE43.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE43.md) (501–512 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 513 | Operator audit export hook fail-closed | `use-audit-page-export.ts` |
| 514 | Finding explainability read sealed-hash + OpenAPI **409** | `ExplanationController.FindingExplain.cs` |
| 515 | Finding explainability client **409 UX** | `FindingExplainabilityDialog.tsx`, `finding-explain-blocked-reason.ts` |
| 516 | Signed review record read OpenAPI **409** | `AuthorityQueryController.Trail.cs` |
| 517 | Artifact bundle/single-artifact download OpenAPI **409** | `ArtifactExportController.RunArtifacts.cs` |
| 518 | Audit evidence package ZIP anchor consolidation | `audit-evidence-package-api.ts` |
| 519 | Pilots sponsor collateral programmatic download **409 UX** | `pilots-collateral-download-api.ts`, `EmailRunToSponsorExportActions.tsx` |
| 520 | First-value report Markdown client **409** + anchor consolidation | `architecture-runs-compare.ts`, `ShareReviewPackageButton.tsx` |
| 521 | Sponsor ROI findings CSV export **409** + anchor consolidation | `SponsorRoiSummarySection.tsx` |
| 522 | Artifact UTF-8 preview sealed-manifest **409 UX** | `architecture-runs-artifacts.ts` |
| 523 | Infra-evidence ask fail-closed blocked-reason | `infra-evidence-ask-blocked-reason.ts`, `InfrastructureAskClient.tsx` |
| 524 | Bundle/traceability programmatic download helpers | `downloads-blob-trigger-artifact-bundle.ts`, `ManifestBuyerBundleDownloadSection.tsx`, `RunDetailArtifactsExportsSection.tsx`, `RunDetailRunActionsSection.tsx` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave44ArchitectureTests.cs`.

**Hasher baseline note:** wave 44 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** see [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE45.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE45.md) (525–536).
