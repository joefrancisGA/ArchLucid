> **Scope:** Contributor-reference — wave-67 robustness controls for architecture create and review (branch `cursor/wave67-robustness-e14f`).

# Architecture create/review robustness — wave 67

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE66.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE66.md) (777–788 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 789 | Draft create POST OpenAPI **409** | `DraftRequestsController.cs` — `CreateDraft`; `DraftRequestsController.SealedManifestGuard.cs` |
| 790 | Wizard intake draft PUT OpenAPI **409** | `WizardIntakeDraftsController.cs` — `UpsertDraft` |
| 791 | Architecture identity PATCH OpenAPI **409** | `ArchitecturesController.cs`, `ArchitecturesController.SealedManifestGuard.cs` — `PatchArchitecture` |
| 792 | Governance promote + activate POST OpenAPI **409** | `GovernanceController.PromotionsActivations.cs` — `Promote`, `Activate` |
| 793 | Governance approval-request create POST OpenAPI **409** | `GovernanceController.ApprovalRequests.Create.cs` — `SubmitApprovalRequest` |
| 794 | Governance batch-review POST OpenAPI **409** | `GovernanceController.ApprovalRequests.Batch.cs` — `BatchReviewApprovalRequests` |
| 795 | Architecture request create mutation `blockedReason` | `architecture-request-create-mutation-blocked-reason.ts`, `wizard-form-create-run-submit.ts`, `use-first-pilot-intake-submit.ts` |
| 796 | Run coverage acknowledgement PUT mutation `blockedReason` | `run-coverage-acknowledgement-mutation-blocked-reason.ts`, `wizard-form-create-run-submit.ts` |
| 797 | Finding inspect disposition POST mutation `blockedReason` | `finding-disposition-mutation-blocked-reason.ts`, `use-finding-inspect-governance-stickiness-dispositions.ts` |
| 798 | Governance record correction POST mutation `blockedReason` | `governance-mutation-correction-blocked-reason.ts`, `GovernanceRecordCorrectionDialog.tsx` |
| 799 | Wizard intake draft PUT fail-closed UX | `wizard-intake-draft-mutation-blocked-reason.ts`, `use-wizard-session-persistence.ts` |
| 800 | Draft create fail-closed UX | `architecture-draft-blocked-reason.ts`, `use-guided-intake-draft-create.ts`, `architecture-creation-init.ts`, `use-architecture-draft-autosave-persist.ts`, `ArchitectureDraftResumeControl.tsx` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave67ArchitectureTests.cs`.

**Hasher baseline note:** wave 67 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** none — see [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE68.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE68.md) (801–812).
