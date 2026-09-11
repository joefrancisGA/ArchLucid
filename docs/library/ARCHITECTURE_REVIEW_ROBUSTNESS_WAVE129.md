> **Scope:** Contributor-reference — wave-129 robustness controls for architecture create and review (branch `cursor/wave129-robustness-e14f`).

# Architecture create/review robustness — wave 129

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE128.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE128.md) (1521–1532 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 1533 | Draft GET read runtime **409** mapper | `DraftRequestsController.cs`, `DraftRequestsController.SealedManifestGuard.cs` — `GetDraft` |
| 1534 | Draft LIST read runtime **409** mapper | `DraftRequestsController.List.cs` — `ListDrafts` |
| 1535 | Draft questions GET runtime **409** mapper | `DraftRequestsController.Questions.cs` — `GetDraftQuestions` |
| 1536 | Draft branch-quota + decision-receipt read runtime **409** mapper | `DraftRequestsController.Lifecycle.Branch.cs` — `GetDraftBranchQuota`, `DownloadDraftDecisionReceipt` |
| 1537 | Wizard intake draft GET runtime **409** mapper | `WizardIntakeDraftsController.cs`, `WizardIntakeDraftsController.SealedManifestGuard.cs` — `GetDraft` |
| 1538 | Planning `/v1/compare` read guard runtime **409** mapper | `ComparisonController.cs`, `ComparisonController.SealedManifestGuard.cs` — `CompareRuns` |
| 1539 | Draft list `apiGet` + `architectureDraftListBlockedReason` | `draft-intake-api-crud.ts`, `use-architecture-draft-list-query.ts`, `ArchitectureDraftListShell.tsx` |
| 1540 | Draft questions + branch-quota `apiGet` + blocked-reason UX | `draft-intake-api-questions.ts`, `draft-intake-api-lifecycle.ts`, `ReviewRoomElicitationPanel.tsx`, `DraftIntakeWhatIfBranchPanel.tsx` |
| 1541 | Wire export-record hook into run detail exports | `use-export-record-query.ts`, `RunDetailExportRecordStatusCallout.tsx`, `RunDetailArtifactsExportsSection.tsx` |
| 1542 | Wire comparison-record hook into compare replay UI | `use-comparison-record-query.ts`, `ArchitectureComparisonReplayCostSection.tsx` |
| 1543 | Wire compare-agent-results hook into compare-two-reviews | `use-compare-agent-results-query.ts`, `CompareAgentResultsBlockedCallout.tsx`, `CompareResultsPanelDiffStack.tsx` |
| 1544 | Wire scope-coverage + export-lineage + comparison-history hooks | `use-governance-scope-coverage-query.ts`, `ReviewAssuranceCoverageGuardCallout.tsx`, `use-export-lineage-verify-query.ts`, `use-run-comparison-history-query.ts`, `RunDetailAssuranceGuardCallouts.tsx` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave129ArchitectureTests.cs`.

**Hasher baseline note:** wave 129 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** see [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE130.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE130.md) (1545–1556) for wave-62 follow-ups (729–740).
