> **Scope:** Contributor-reference — wave-68 robustness controls for architecture create and review (branch `cursor/wave68-robustness-e14f`).

# Architecture create/review robustness — wave 68

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE67.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE67.md) (789–800 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 801 | Draft submit POST OpenAPI **409** | `DraftRequestsController.Lifecycle.AdmitSubmit.cs` — `SubmitDraft`; `DraftRequestsController.SealedManifestGuard.cs` |
| 802 | Governance approve + reject POST OpenAPI **409** | `GovernanceController.ApprovalRequests.Review.cs` — `Approve`, `Reject`; `GovernanceController.SealedManifestGuard.cs` |
| 803 | Policy-pack assign POST sealed guard + **409** | `PolicyPackHttpFacade.Crud.cs` — `AssignAsync`; `PolicyPacksController.Assignment.cs` — `Assign` |
| 804 | Policy-pack archive POST sealed guard + **409** | `PolicyPackHttpFacade.Crud.cs` — `ArchiveAssignmentAsync`; `PolicyPacksController.Assignment.cs` — `ArchiveAssignment` |
| 805 | Run operator disposition POST OpenAPI **409** | `AuthorityQueryController.RunDetail.cs` — `RecordRunOperatorGovernanceDisposition`; `AuthorityQueryController.SealedManifestGuard.cs` |
| 806 | Run replay POST OpenAPI **409** | `RunsController.CommitReplayPin.Replay.cs` — `ReplayRun`; `RunsController.SealedManifestGuard.cs` |
| 807 | Export blob-push mutation `blockedReason` + UX | `run-export-blob-push-mutation-blocked-reason.ts`, `run-export-blob-push-api.ts`, `use-run-export-blob-push-mutation.ts`, `RunDetailExportBlobPushPanel.tsx`, `RunDetailArtifactsExportsSection.tsx` |
| 808 | Policy-pack assign mutation `blockedReason` | `policy-pack-assign-mutation-blocked-reason.ts`, `use-policy-packs-create-publish.ts` — `onAssign` |
| 809 | Policy-pack archive mutation `blockedReason` + UX | `policy-pack-archive-mutation-blocked-reason.ts`, `archivePolicyPackAssignment` in `policy-packs-api-assign.ts`, `use-policy-packs-workspace-selection.ts` |
| 810 | Architecture identity PATCH mutation `blockedReason` | `architecture-identity-mutation-blocked-reason.ts`, `ArchitectureIdentityRenameForm.tsx`, `ArchitectureIdentityArchiveControl.tsx` |
| 811 | Run operator governance disposition mutation `blockedReason` | `run-operator-governance-disposition-mutation-blocked-reason.ts`, `RunDetailRunGovernanceDispositionActions.tsx` |
| 812 | What-if branch submit fail-closed UX | `architectureDraftIntakeMutationBlockedReason` in `use-review-package-what-if-execute.ts`, `ReviewPackageWhatIfExecutePanel.tsx` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave68ArchitectureTests.cs`.

**Hasher baseline note:** wave 68 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** none.
