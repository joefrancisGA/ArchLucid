> **Scope:** Contributor-reference — wave-47 robustness controls for architecture create and review (branch `cursor/wave47-robustness-e14f`).

# Architecture create/review robustness — wave 47

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE46.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE46.md) (537–548 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 549 | Review-trail provenance read OpenAPI **409** | `AuthorityRunReadHandlers.cs`, `AuthorityReadsController.cs`, `AuthorityQueryController.Trail.cs` |
| 550 | Coordinator provenance read OpenAPI **409** + fail-closed UX | `RunQueryController.Provenance.cs`, `architecture-runs-read-detail-artifacts.ts`, `run-provenance-blocked-reason.ts`, `provenance/page.tsx` |
| 551 | Architecture seal-delta read OpenAPI **409** | `ArchitectureSealDeltaService.cs`, `ArchitecturesController.cs` |
| 552 | Architecture seal-delta fetch fail-closed UX | `architecture-seal-delta-api.ts`, `architecture-seal-delta-blocked-reason.ts`, `ArchitectureSealDeltaPanel.tsx` |
| 553 | Compare run-pair JSON reads → `apiGetSealedManifestAware` | `architecture-runs-compare.ts` |
| 554 | Compare end-to-end replay read fail-closed UX | `architecture-runs-compare.ts` (`compareRunsEndToEnd`) |
| 555 | Run explanation aggregate read fail-closed UX | `architecture-runs-read-detail-artifacts.ts` (`getRunExplanationSummary`) |
| 556 | Finding evidence chain + inspect read OpenAPI **409** | `RunQueryController.Findings.cs` |
| 557 | Finding evidence / inspect / LLM-audit client sealed-manifest reads | `findings-api.ts`, `finding-evidence-chain-blocked-reason.ts` |
| 558 | Sealed-records manifest bundle programmatic download | `ManifestDetailBundleExportButton.tsx`, `ManifestDetailPageView.tsx`, `ManifestDetailDeliverablesCard.tsx`, `ManifestDetailSummaryDecisionsBlocks.tsx` |
| 559 | Sponsor/share/header export programmatic consolidation | `EmailRunToSponsorExportActions.tsx`, `ReviewPackageSponsorHandoffStrip.tsx`, `RunDetailPageHeader.tsx` |
| 560 | Architecture package DOCX programmatic download | `downloads-blob-trigger-architecture-package-docx.ts`, `ManifestDeliverableGrid.tsx`, `EmailRunToSponsorExportActions.tsx` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave47ArchitectureTests.cs`.

**Hasher baseline note:** wave 47 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** see [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE48.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE48.md) (561–572).
