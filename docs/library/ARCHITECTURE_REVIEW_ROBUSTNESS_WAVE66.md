> **Scope:** Contributor-reference — wave-66 robustness controls for architecture create and review (branch `cursor/wave66-robustness-e14f`).

# Architecture create/review robustness — wave 66

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE65.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE65.md) (765–776 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 777 | Policy-pack publish + create POST OpenAPI **409** | `PolicyPacksController.Crud.cs` — `Create`, `Publish`; `PolicyPackHttpFacade.MutationSealedManifestGuard.cs` |
| 778 | Policy-pack assignment enabled/org-required PUT OpenAPI **409** | `PolicyPacksController.Assignment.cs` — `SetAssignmentEnabled`, `SetAssignmentOrganizationRequired` |
| 779 | Policy-pack duplicate + delete OpenAPI **409** | `PolicyPacksController.Crud.cs` — `DuplicatePack`, `DeletePack` |
| 780 | Draft question mutations OpenAPI **409** | `DraftRequestsController.Questions.cs` — `AnswerQuestion`, `SkipQuestion`, `ReasonDraft` |
| 781 | Draft admit + branch POST OpenAPI **409** | `DraftRequestsController.Lifecycle.AdmitSubmit.cs`, `DraftRequestsController.Lifecycle.Branch.cs` |
| 782 | Draft abandon/reopen/clone-snapshot POST OpenAPI **409** | `DraftRequestsController.Lifecycle.AbandonReopen.cs`, `DraftRequestsController.Lifecycle.CloneSnapshot.cs` |
| 783 | Policy-pack mutation `blockedReason` | `policy-pack-mutation-blocked-reason.ts`, `use-policy-packs-create-publish.ts`, `use-policy-packs-workspace-selection.ts` |
| 784 | Draft intake mutation `blockedReason` | `architecture-draft-blocked-reason.ts`, `use-guided-intake-draft-admit.ts`, `use-guided-intake-draft-submit.ts`, `use-review-presenter-elicitation.ts` |
| 785 | Risk-exception renew/revoke mutation `blockedReason` | `risk-exception-mutation-blocked-reason.ts`, `use-risk-exceptions-client.ts` |
| 786 | Finding feedback POST mutation `blockedReason` | `finding-feedback-mutation-blocked-reason.ts`, `FindingFeedbackThumbs.tsx` |
| 787 | Advisory recommendation apply mutation `blockedReason` | `advisory-recommendation-apply-mutation-blocked-reason.ts`, `use-advisory-scans-content.ts` |
| 788 | Finalize commit POST sealed-manifest `blockedReason` | `review-finalize-mutation-blocked-reason.ts`, `CommitRunButton.tsx` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave66ArchitectureTests.cs`.

**Hasher baseline note:** wave 66 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** see [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE67.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE67.md) (789–800).
