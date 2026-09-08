> **Scope:** Contributor-reference — wave-46 robustness controls for architecture create and review (branch `cursor/wave46-robustness-e14f`).

# Architecture create/review robustness — wave 46

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE45.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE45.md) (525–536 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 537 | Artifact descriptor read OpenAPI **409** | `ArtifactExportController.RunArtifacts.cs` |
| 538 | Canonical runs manifest read OpenAPI **409** | `AuthorityReadsController.cs` |
| 539 | Compare provenance trails read **409 UX** | `use-compare-provenance-trails-query.ts`, `CompareProvenanceDeltaBand.tsx` |
| 540 | Compare manifest diff appendix fail-closed UX | `CompareRawManifestDiffSection.tsx`, `compare-manifest-diff-blocked-reason.ts` |
| 541 | Manifest JSON fetch helper **409 UX** | `manifest-json-fetch.ts`, `signed-review-record-blocked-reason.ts` |
| 542 | Governance posture read fail-closed UX | `governance-stickiness-api-registers.ts`, `governance-posture-blocked-reason.ts`, `ArchitecturePosturePillarOverview.tsx` |
| 543 | Sponsor ROI summary fetch fail-closed UX | `fetch-sponsor-roi-summary-client.ts`, `sponsor-roi-summary-blocked-reason.ts`, `OperatorHomeSponsorRoiStrip.tsx` |
| 544 | Cross-tenant portfolio read fail-closed UX | `RoiController.cs`, `fetch-cross-tenant-portfolio-client.ts`, `cross-tenant-portfolio-blocked-reason.ts` |
| 545 | Run package DOCX programmatic download | `downloads-blob-trigger-run-package.ts`, `RunDetailArtifactsExportsSection.tsx` |
| 546 | Review export ZIP + artifact bundle anchor consolidation | `downloads-blob-trigger-run-export.ts`, `RunDetailArtifactsExportsSection.tsx` |
| 547 | Per-artifact + decision-receipt programmatic download | `downloads-blob-trigger-artifact-single.ts`, `downloads-blob-trigger-decision-receipt.ts`, `ArtifactListTable.tsx`, `DecisionReceiptExportButton.tsx` |
| 548 | Server manifest markdown export surface wiring | `manifest-markdown-export-api.ts`, `manifest-markdown-export-blocked-reason.ts`, `GoldenManifestExportMenu.tsx` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave46ArchitectureTests.cs`.

**Hasher baseline note:** wave 46 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** none.
