> **Scope:** Contributor-reference — wave-132 robustness controls for architecture create and review (branch `cursor/wave132-robustness-e14f`).

# Architecture create/review robustness — wave 132

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE131.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE131.md) (1557–1568 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 1569 | Finding disposition POST runtime **409** mapper | `GovernanceStickinessController.Dispositions.cs` — `RecordDisposition` |
| 1570 | Finding bulk disposition POST runtime **409** mapper | same file — `RecordBulkDisposition` |
| 1571 | Finding merge-conflict resolve POST runtime **409** mapper | same file — `ResolveFindingMergeConflict` |
| 1572 | Run coverage acknowledgement PUT/PATCH sealed guard runtime **409** | `RunCoverageController.Acknowledgement.cs` — `PutAcknowledgedCoverage`, `PatchRunCoveragePack` |
| 1573 | Risk-exception revoke/renew runtime **409** mapper | `GovernanceStickinessController.Exceptions.cs` — `RevokeRiskException`, `RenewRiskException` |
| 1574 | Policy pack assign runtime **409** mapper | `PolicyPacksController.Assignment.cs`, `PolicyPackHttpResultMapper.MapAssign` |
| 1575 | Governance workflow run-lists fail-closed UX | `use-governance-workflow-run-lists-query.ts`, `GovernanceWorkflowRunListsBlockedCallout.tsx`, `GovernanceWorkflowPageShell.tsx` |
| 1576 | Finding remediation assignment mutation `blockedReason` | `finding-remediation-assignment-blocked-reason.ts`, `use-finding-inspect-governance-stickiness-remediation.ts` |
| 1577 | Ask run coverage honesty fail-closed | `use-ask-run-coverage-honesty-query.ts`, `AskRunCoverageHonestyStrip.tsx` |
| 1578 | Package print meeting-capture bundle **409 UX** | `use-package-print-meeting-capture-query.ts`, `PackagePrintPageClient.tsx`, `PackagePrintPageView.tsx` |
| 1579 | Governance findings quiet-engines hint fail-closed | `GovernanceFindingsQueueQuietEnginesHint.tsx`, `governance-findings-queue-quiet-engines-blocked-reason.ts` |
| 1580 | Bulk disposition + merge-conflict mutation `blockedReason` | `finding-bulk-disposition-blocked-reason.ts`, `finding-merge-conflict-blocked-reason.ts`, `GovernanceFindingsBulkActions.tsx`, `FindingMergeConflictResolvePanel.tsx` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave132ArchitectureTests.cs`.

**Hasher baseline note:** wave 132 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** see [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE133.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE133.md) (1581–1592).
