> **Scope:** Contributor-reference — wave-70 robustness controls for architecture create and review (branch `cursor/wave70-robustness-e14f`).

# Architecture create/review robustness — wave 70

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE69.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE69.md) (813–824 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 825 | Run pin PATCH OpenAPI **409** | `RunsController.CommitReplayPin.Pin.cs` — `PinRun`; `RunsController.SealedManifestGuard.cs` |
| 826 | Run soft-archive POST OpenAPI **409** | `RunsController.Archive.cs` — `ArchiveRun`; sealed review blocked returns **409** (was **400**) |
| 827 | Async replay POST OpenAPI **409** | `RunsController.AsyncOperations.cs` — `ReplayRunAsync`; `RunsController.SealedManifestGuard.cs` |
| 828 | Agent result submit POST OpenAPI **409** | `RunsController.cs` — `SubmitAgentResult`; `RunsController.SealedManifestGuard.cs` |
| 829 | Comparison metadata PATCH OpenAPI **409** | `ComparisonsController.History.cs` — `UpdateComparisonRecord`; `ComparisonsController.SealedManifestGuard.cs` |
| 830 | Batch create POST OpenAPI **409** | `RunsController.Create.Batch.cs` — `CreateRunBatch` idempotency conflict |
| 831 | Architecture request restore mutation `blockedReason` | `architecture-request-lifecycle-mutation-blocked-reason.ts`, `use-runs-dashboard-load-phase.ts` |
| 832 | Architecture request clone/archive/delete API + shared `blockedReason` | `architecture-runs-lifecycle.ts`, `architecture-request-lifecycle-mutation-blocked-reason.ts` |
| 833 | Review archive mutation `blockedReason` | `review-archive-mutation-blocked-reason.ts`, `ReviewArchiveControl.tsx` |
| 834 | Authority replay mutation `blockedReason` | `review-replay-mutation-blocked-reason.ts`, `use-replay-form.ts` |
| 835 | Comparison replay PDF mutation `blockedReason` | `comparison-replay-mutation-blocked-reason.ts`, `use-compare-results-panel.ts` |
| 836 | Governance batch-review quick approve `blockedReason` | `governance-batch-review-mutation-blocked-reason.ts`, `GovernanceQuickApproveButton.tsx` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave70ArchitectureTests.cs`.

**Hasher baseline note:** wave 70 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** none — see [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE71.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE71.md) (837–848).
