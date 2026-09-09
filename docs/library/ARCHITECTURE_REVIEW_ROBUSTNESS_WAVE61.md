> **Scope:** Contributor-reference — wave-61 robustness controls for architecture create and review (branch `cursor/wave61-robustness-e14f`).

# Architecture create/review robustness — wave 61

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE60.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE60.md) (705–716 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 717 | Draft GET read OpenAPI **409** | `DraftRequestsController.cs`, `DraftRequestsController.SealedManifestGuard.cs`, `DraftIntakeSealedManifestReadGuard.cs` |
| 718 | Draft LIST read OpenAPI **409** | `DraftRequestsController.List.cs`, `DraftIntakeSealedManifestReadGuard.cs` |
| 719 | Draft questions GET OpenAPI **409** | `DraftRequestsController.Questions.cs` |
| 720 | Draft branch-quota + decision-receipt read OpenAPI **409** | `DraftRequestsController.Lifecycle.Branch.cs` |
| 721 | Wizard intake draft GET OpenAPI **409** | `WizardIntakeDraftsController.cs`, `WizardIntakeDraftsController.SealedManifestGuard.cs` |
| 722 | Planning `/v1/compare` read guard OpenAPI **409** | `ComparisonController.cs`, `ComparisonController.SealedManifestGuard.cs` |
| 723 | Draft list sealed client + fail-closed hook | `draft-intake-api-crud.ts`, `use-architecture-draft-list-query.ts`, `architecture-draft-list-blocked-reason.ts`, `ArchitectureDraftListShell.tsx` |
| 724 | Draft questions + branch-quota sealed clients + blocked-reason hooks | `draft-intake-api-questions.ts`, `draft-intake-api-lifecycle.ts`, `use-review-presenter-elicitation.ts`, `use-draft-branch-quota-query.ts` |
| 725 | Wire export-record hook into run detail exports | `use-export-record-query.ts`, `RunDetailExportRecordStatusCallout.tsx`, `RunDetailArtifactsExportsSection.tsx` |
| 726 | Wire comparison-record hook into compare replay UI | `use-comparison-record-query.ts`, `ArchitectureComparisonReplayCostSection.tsx` |
| 727 | Wire compare-agent-results hook into compare-two-reviews | `use-compare-agent-results-query.ts`, `CompareAgentResultsBlockedCallout.tsx`, `CompareResultsPanelDiffStack.tsx` |
| 728 | Wire scope-coverage + export-lineage + comparison-history hooks | `use-governance-scope-coverage-query.ts`, `ReviewAssuranceCoverageGuardCallout.tsx`, `use-export-lineage-verify-query.ts`, `use-run-comparison-history-query.ts`, `RunDetailAssuranceGuardCallouts.tsx` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave61ArchitectureTests.cs`.

**Hasher baseline note:** wave 61 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** see [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE62.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE62.md) (729–740).
