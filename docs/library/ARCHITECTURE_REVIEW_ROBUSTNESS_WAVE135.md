> **Scope:** Contributor-reference — wave-135 robustness controls for architecture create and review (branch `cursor/wave135-robustness-e14f`).

# Architecture create/review robustness — wave 135

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE134.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE134.md) (1593–1604 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 1605 | Draft create POST runtime **409** mapper | `DraftRequestsController.cs` — `CreateDraft`; `DraftRequestsController.SealedManifestGuard.cs` |
| 1606 | Wizard intake draft PUT runtime **409** guard | `WizardIntakeDraftsController.cs` — `UpsertDraft` |
| 1607 | Architecture identity PATCH runtime **409** mapper | `ArchitecturesController.cs`, `ArchitecturesController.SealedManifestGuard.cs` — `PatchArchitecture` |
| 1608 | Governance promote + activate POST runtime **409** guard | `GovernanceController.PromotionsActivations.cs` — `Promote`, `Activate` |
| 1609 | Governance approval-request create POST runtime **409** guard | `GovernanceController.ApprovalRequests.Create.cs` — `SubmitApprovalRequest` |
| 1610 | Governance batch-review POST runtime **409** guard | `GovernanceController.ApprovalRequests.Batch.cs` — `BatchReviewApprovalRequests` |
| 1611 | Architecture request create mutation `blockedReason` | `architecture-request-create-mutation-blocked-reason.ts`, `wizard-form-create-run-submit.ts`, `use-first-pilot-intake-submit.ts` |
| 1612 | Run coverage acknowledgement PUT mutation `blockedReason` | `run-coverage-acknowledgement-mutation-blocked-reason.ts`, `wizard-form-create-run-submit.ts` |
| 1613 | Finding inspect disposition POST mutation `blockedReason` | `finding-disposition-mutation-blocked-reason.ts`, `use-finding-inspect-governance-stickiness-dispositions.ts` |
| 1614 | Governance record correction POST mutation `blockedReason` | `governance-mutation-correction-blocked-reason.ts`, `GovernanceRecordCorrectionDialog.tsx` |
| 1615 | Wizard intake draft PUT fail-closed UX | `wizard-intake-draft-mutation-blocked-reason.ts`, `use-wizard-session-persistence.ts` |
| 1616 | Draft create fail-closed UX | `architecture-draft-blocked-reason.ts`, `use-guided-intake-draft-create.ts`, `architecture-creation-init.ts`, `use-architecture-draft-autosave-persist.ts`, `ArchitectureDraftResumeControl.tsx` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave135ArchitectureTests.cs`.

**Hasher baseline note:** wave 135 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** see [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE136.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE136.md) (1617–1628) for wave-68 follow-ups (801–812).
