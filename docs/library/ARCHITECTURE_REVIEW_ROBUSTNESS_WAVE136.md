> **Scope:** Contributor-reference — wave-136 robustness controls for architecture create and review (branch `cursor/wave136-robustness-e14f`).

# Architecture create/review robustness — wave 136

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE135.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE135.md) (1605–1616 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 1617 | Draft submit POST runtime **409** mapper | `DraftRequestsController.Lifecycle.AdmitSubmit.cs` — `SubmitDraft`; `DraftRequestsController.SealedManifestGuard.cs` |
| 1618 | Governance approve + reject POST runtime **409** mapper | `GovernanceController.ApprovalRequests.Review.cs` — `Approve`, `Reject`; `GovernanceController.SealedManifestGuard.cs` |
| 1619 | Policy-pack assign POST runtime **409** mapper | `PolicyPackHttpFacade.Crud.cs` — `AssignAsync`; `PolicyPacksController.Assignment.cs` — `Assign` |
| 1620 | Policy-pack archive POST runtime **409** mapper | `PolicyPackHttpFacade.Crud.cs` — `ArchiveAssignmentAsync`; `PolicyPacksController.Assignment.cs` — `ArchiveAssignment` |
| 1621 | Run operator disposition POST runtime **409** mapper | `AuthorityQueryController.RunDetail.cs` — `RecordRunOperatorGovernanceDisposition`; `AuthorityQueryController.SealedManifestGuard.cs` |
| 1622 | Run replay POST runtime **409** mapper | `RunsController.CommitReplayPin.Replay.cs` — `ReplayRun`; `RunsController.SealedManifestGuard.cs` |
| 1623 | Export blob-push mutation `blockedReason` + UX | `run-export-blob-push-mutation-blocked-reason.ts`, `run-export-blob-push-api.ts`, `use-run-export-blob-push-mutation.ts`, `RunDetailExportBlobPushPanel.tsx`, `RunDetailArtifactsExportsSection.tsx` |
| 1624 | Policy-pack assign mutation `blockedReason` | `policy-pack-assign-mutation-blocked-reason.ts`, `use-policy-packs-create-publish.ts` — `onAssign` |
| 1625 | Policy-pack archive mutation `blockedReason` + UX | `policy-pack-archive-mutation-blocked-reason.ts`, `archivePolicyPackAssignment` in `policy-packs-api-assign.ts`, `use-policy-packs-workspace-selection.ts` |
| 1626 | Architecture identity PATCH mutation `blockedReason` | `architecture-identity-mutation-blocked-reason.ts`, `ArchitectureIdentityRenameForm.tsx`, `ArchitectureIdentityArchiveControl.tsx` |
| 1627 | Run operator governance disposition mutation `blockedReason` | `run-operator-governance-disposition-mutation-blocked-reason.ts`, `RunDetailRunGovernanceDispositionActions.tsx` |
| 1628 | What-if branch submit fail-closed UX | `architectureDraftIntakeMutationBlockedReason` in `use-review-package-what-if-execute.ts`, `ReviewPackageWhatIfExecutePanel.tsx` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave136ArchitectureTests.cs`.

**Hasher baseline note:** wave 136 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** see [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE137.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE137.md) (1629–1640) for wave-69 follow-ups (813–824).
