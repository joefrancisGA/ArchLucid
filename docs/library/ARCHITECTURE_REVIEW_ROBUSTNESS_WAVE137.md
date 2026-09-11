> **Scope:** Contributor-reference — wave-137 robustness controls for architecture create and review (branch `cursor/wave137-robustness-e14f`).

# Architecture create/review robustness — wave 137

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE136.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE136.md) (1617–1628 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 1629 | Run execute POST (sync + async + selective) runtime **409** mapper | `RunsController.Execute.cs` — `ExecuteRun`, `ExecuteRunSelective`; `RunsController.AsyncOperations.cs` — `ExecuteRunAsync`; `RunsController.SealedManifestGuard.cs` |
| 1630 | Run finalize POST runtime **409** mapper | `RunsController.CommitReplayPin.Commit.cs` — `CommitRun`; `RunsController.SealedManifestGuard.cs` |
| 1631 | Technology ledger PATCH runtime **409** mapper | `TechnologyLedgerController.cs` — `EnsureSealedManifestReadAllowedAsync` on PATCH |
| 1632 | Clarification answers POST runtime **409** mapper | `ReviewClarificationQuestionsController.cs` — `EnsureSealedManifestReadAllowedAsync` on POST |
| 1633 | Architecture request clone/archive/delete/restore runtime **409** mapper | `RunsController.ArchitectureRequests.cs` — `CloneRequest`, `ArchiveRequest`, `DeleteRequest`, `RestoreRequest`; `RunsController.SealedManifestGuard.cs` |
| 1634 | Governance environment catalog PUT runtime **409** mapper | `GovernanceEnvironmentCatalogController.cs` — `Replace`; `GovernanceEnvironmentCatalogController.SealedManifestGuard.cs` |
| 1635 | Re-run review execute mutation `blockedReason` | `review-execute-mutation-blocked-reason.ts`, `ReRunReviewButton.tsx` |
| 1636 | Selective agent re-execute mutation `blockedReason` | `review-selective-execute-mutation-blocked-reason.ts`, `RunAgentResultsSummaryCard.tsx` |
| 1637 | Risk-exception create/revoke mutation `blockedReason` | `risk-exception-mutation-blocked-reason.ts`, `use-finding-inspect-governance-stickiness-waivers.ts` |
| 1638 | Technology ledger PATCH mutation `blockedReason` | `technology-ledger-mutation-blocked-reason.ts`, `TechnologyBaselinePanel.tsx` |
| 1639 | Clarification answers submit mutation `blockedReason` | `clarification-answers-mutation-blocked-reason.ts`, `ClarificationAnswerCapturePanel.tsx` |
| 1640 | Governance environment catalog replace mutation `blockedReason` | `governance-environment-catalog-mutation-blocked-reason.ts`, `GovernanceEnvironmentsClient.tsx` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave137ArchitectureTests.cs`.

**Hasher baseline note:** wave 137 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** see [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE138.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE138.md) (1641–1652).
