> **Scope:** Contributor-reference — wave-134 robustness controls for architecture create and review (branch `cursor/wave134-robustness-e14f`).

# Architecture create/review robustness — wave 134

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE133.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE133.md) (1581–1592 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 1593 | Policy-pack publish + create POST runtime **409** mapper | `PolicyPacksController.Crud.cs` — `Create`, `Publish`; `PolicyPackHttpFacade.MutationSealedManifestGuard.cs` |
| 1594 | Policy-pack assignment enabled/org-required PUT runtime **409** mapper | `PolicyPacksController.Assignment.cs` — `SetAssignmentEnabled`, `SetAssignmentOrganizationRequired` |
| 1595 | Policy-pack duplicate + delete runtime **409** mapper | `PolicyPacksController.Crud.cs` — `DuplicatePack`, `DeletePack` |
| 1596 | Draft question mutations runtime **409** guard | `DraftRequestsController.Questions.cs` — `AnswerQuestion`, `SkipQuestion`, `ReasonDraft` |
| 1597 | Draft admit + branch POST runtime **409** guard | `DraftRequestsController.Lifecycle.AdmitSubmit.cs`, `DraftRequestsController.Lifecycle.Branch.cs` |
| 1598 | Draft abandon/reopen/clone-snapshot POST runtime **409** guard | `DraftRequestsController.Lifecycle.AbandonReopen.cs`, `DraftRequestsController.Lifecycle.CloneSnapshot.cs` |
| 1599 | Policy-pack mutation `blockedReason` | `policy-pack-mutation-blocked-reason.ts`, `use-policy-packs-create-publish.ts`, `use-policy-packs-workspace-selection.ts` |
| 1600 | Draft intake mutation `blockedReason` | `architecture-draft-blocked-reason.ts`, `use-guided-intake-draft-admit.ts`, `use-guided-intake-draft-submit.ts`, `use-review-presenter-elicitation.ts` |
| 1601 | Risk-exception renew/revoke mutation `blockedReason` | `risk-exception-mutation-blocked-reason.ts`, `use-risk-exceptions-client.ts` |
| 1602 | Finding feedback POST mutation `blockedReason` | `finding-feedback-mutation-blocked-reason.ts`, `FindingFeedbackThumbs.tsx` |
| 1603 | Advisory recommendation apply mutation `blockedReason` | `advisory-recommendation-apply-mutation-blocked-reason.ts`, `use-advisory-scans-content.ts` |
| 1604 | Finalize commit POST sealed-manifest `blockedReason` | `review-finalize-mutation-blocked-reason.ts`, `CommitRunButton.tsx` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave134ArchitectureTests.cs`.

**Hasher baseline note:** wave 134 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** see [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE135.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE135.md) (1605–1616).
