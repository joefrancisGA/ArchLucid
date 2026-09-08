> **Scope:** Contributor-reference — wave-42 robustness controls for architecture create and review (branch `cursor/wave42-robustness-e14f`).

# Architecture create/review robustness — wave 42

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE41.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE41.md) (477–488 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 489 | Governance dashboard OpenAPI **409** | `GovernanceController.Insights.cs` |
| 490 | Governance posture OpenAPI **409** | `GovernancePostureController.cs` |
| 491 | Manifest summary OpenAPI **409** | `AuthorityQueryController.Trail.cs` |
| 492 | Operator audit export OpenAPI **409** | `AuditController.Export.Download.cs`, `AuditController.Export.Csv.cs` |
| 493 | Finding remediation assignment OpenAPI **409** | `FindingRemediationAssignmentController.cs` |
| 494 | Authority replay OpenAPI **409** | `AuthorityReplayController.cs` |
| 495 | Ask stream OpenAPI **409** | `AskController.cs` |
| 496 | Run + Terraform advisory export **409 UX** | `downloads-blob-trigger-run-export.ts`, `downloads-blob-trigger-terraform.ts` |
| 497 | Findings CSV export **409 UX** | `findings-api.ts` |
| 498 | Comparison PDF + value-report DOCX **409 UX** | `downloads-export-jobs.ts` |
| 499 | Run aggregate explain fail-closed **409 UX** | `explain-run-blocked-reason.ts`, `RunDetailRunExplanationCollapsible.tsx` |
| 500 | Governance overview + manifest detail sealed-hash **409 UX** | `governance-sealed-manifest-blocked-reason.ts`, `GovernanceOverviewSummaryPanelShell.tsx`, `ManifestDetailPageErrorViews.tsx` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave42ArchitectureTests.cs`.

**Hasher baseline note:** wave 42 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** none.
