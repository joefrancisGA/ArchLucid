> **Scope:** Contributor-reference — wave-69 robustness controls for architecture create and review (branch `cursor/wave69-robustness-e14f`).

# Architecture create/review robustness — wave 69

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE68.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE68.md) (801–812 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 813 | Run execute POST (sync + async + selective) OpenAPI **409** | `RunsController.Execute.cs` — `ExecuteRun`, `ExecuteRunSelective`; `RunsController.AsyncOperations.cs` — `ExecuteRunAsync`; `RunsController.SealedManifestGuard.cs` |
| 814 | Run finalize POST OpenAPI **409** | `RunsController.CommitReplayPin.Commit.cs` — `CommitRun`; `RunsController.SealedManifestGuard.cs` |
| 815 | Technology ledger PATCH OpenAPI **409** | `TechnologyLedgerController.cs` — `EnsureSealedManifestReadAllowedAsync` on PATCH |
| 816 | Clarification answers POST OpenAPI **409** | `ReviewClarificationQuestionsController.cs` — `EnsureSealedManifestReadAllowedAsync` on POST |
| 817 | Architecture request clone/archive/delete/restore OpenAPI **409** | `RunsController.ArchitectureRequests.cs` — `CloneRequest`, `ArchiveRequest`, `DeleteRequest`, `RestoreRequest`; `RunsController.SealedManifestGuard.cs` |
| 818 | Governance environment catalog PUT OpenAPI **409** | `GovernanceEnvironmentCatalogController.cs` — `Replace`; `GovernanceEnvironmentCatalogController.SealedManifestGuard.cs` |
| 819 | Re-run review execute mutation `blockedReason` | `review-execute-mutation-blocked-reason.ts`, `ReRunReviewButton.tsx` |
| 820 | Selective agent re-execute mutation `blockedReason` | `review-selective-execute-mutation-blocked-reason.ts`, `RunAgentResultsSummaryCard.tsx` |
| 821 | Risk-exception create/revoke mutation `blockedReason` | `risk-exception-mutation-blocked-reason.ts`, `use-finding-inspect-governance-stickiness-waivers.ts` |
| 822 | Technology ledger PATCH mutation `blockedReason` | `technology-ledger-mutation-blocked-reason.ts`, `TechnologyBaselinePanel.tsx` |
| 823 | Clarification answers submit mutation `blockedReason` | `clarification-answers-mutation-blocked-reason.ts`, `ClarificationAnswerCapturePanel.tsx` |
| 824 | Governance environment catalog replace mutation `blockedReason` | `governance-environment-catalog-mutation-blocked-reason.ts`, `GovernanceEnvironmentsClient.tsx` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave69ArchitectureTests.cs`.

**Hasher baseline note:** wave 69 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** none.
