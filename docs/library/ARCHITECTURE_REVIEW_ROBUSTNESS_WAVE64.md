> **Scope:** Contributor-reference — wave-64 robustness controls for architecture create and review (branch `cursor/wave64-robustness-e14f`).

# Architecture create/review robustness — wave 64

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE63.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE63.md) (741–752 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 753 | Finding disposition POST OpenAPI **409** | `GovernanceStickinessController.Dispositions.cs` — `RecordDisposition` |
| 754 | Finding bulk disposition POST OpenAPI **409** | Same file — `RecordBulkDisposition` |
| 755 | Finding merge-conflict resolve POST OpenAPI **409** | Same file — `ResolveFindingMergeConflict` |
| 756 | Run coverage acknowledgement PUT sealed guard | `RunCoverageController.Acknowledgement.cs` — `PutAcknowledgedCoverage` / `PatchRunCoveragePack` |
| 757 | Risk-exception revoke/renew OpenAPI **409** | `GovernanceStickinessController.Exceptions.cs` |
| 758 | Policy pack assign OpenAPI **409** | `PolicyPacksController.Assignment.cs`, `PolicyPackHttpResultMapper.MapAssign` |
| 759 | Governance workflow run-lists fail-closed UX | `use-governance-workflow-run-lists-query.ts`, `GovernanceWorkflowRunListsBlockedCallout.tsx`, `GovernanceWorkflowPageShell.tsx` |
| 760 | Finding remediation assignment mutation `blockedReason` | `finding-remediation-assignment-blocked-reason.ts`, `use-finding-inspect-governance-stickiness-remediation.ts` |
| 761 | Ask run coverage honesty fail-closed | `use-ask-run-coverage-honesty-query.ts`, `AskRunCoverageHonestyStrip.tsx` |
| 762 | Package print meeting-capture bundle **409 UX** | `use-package-print-meeting-capture-query.ts`, `PackagePrintPageClient.tsx`, `PackagePrintPageView.tsx` |
| 763 | Governance findings quiet-engines hint fail-closed | `GovernanceFindingsQueueQuietEnginesHint.tsx`, `governance-findings-queue-quiet-engines-blocked-reason.ts` |
| 764 | Bulk disposition + merge-conflict mutation `blockedReason` | `finding-bulk-disposition-blocked-reason.ts`, `finding-merge-conflict-blocked-reason.ts`, `GovernanceFindingsBulkActions.tsx`, `FindingMergeConflictResolvePanel.tsx` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave64ArchitectureTests.cs`.

**Hasher baseline note:** wave 64 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** none.