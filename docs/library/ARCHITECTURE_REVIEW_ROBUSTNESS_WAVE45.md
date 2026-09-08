> **Scope:** Contributor-reference — wave-45 robustness controls for architecture create and review (branch `cursor/wave45-robustness-e14f`).

# Architecture create/review robustness — wave 45

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE44.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE44.md) (513–524 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 525 | Signed review record JSON read client **409 UX** | `signed-review-record-blocked-reason.ts`, `api-get-sealed-manifest-aware.ts`, `DownloadManifestButton.tsx`, `CopyManifestButton.tsx` |
| 526 | Compare/diff manifest reads **409 UX** | `use-compare-governance-diff-query.ts`, `resolve-architecture-manifest-json-for-diff.ts` |
| 527 | Manifest summary/artifact list read **409 UX** | `architecture-runs-artifacts.ts`, `architecture-runs-read-detail-artifacts.ts` |
| 528 | Manifest markdown server export download helper | `manifest-markdown-export-api.ts`, `downloads-blob-trigger.ts` |
| 529 | Sponsor dashboard bundle OpenAPI **409** | `RoiController.cs` |
| 530 | Sponsor dashboard bundle fail-closed UX | `sponsor-dashboard-bundle-blocked-reason.ts`, `fetch-sponsor-dashboard-bundle-client.ts`, `SponsorDashboardDataContext.tsx` |
| 531 | Learning planning report OpenAPI **409** | `LearningController.PlanningReport.cs` |
| 532 | Product learning triage report OpenAPI **409** | `ProductLearningController.Triage.cs` |
| 533 | Learning planning report export fail-closed UX | `learning-planning-report-blocked-reason.ts`, `PlanningExportReadinessNote.tsx` |
| 534 | Product learning report export fail-closed UX | `product-learning-report-blocked-reason.ts`, `ProductLearningPageView.tsx` |
| 535 | Infra-evidence hub fail-closed blocked-reason | `infra-evidence-hub-blocked-reason.ts`, `infra-evidence-hub-api.ts` |
| 536 | Cross-tenant portfolio OpenAPI **409** | `RoiController.cs` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave45ArchitectureTests.cs`.

**Hasher baseline note:** wave 45 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** none.
