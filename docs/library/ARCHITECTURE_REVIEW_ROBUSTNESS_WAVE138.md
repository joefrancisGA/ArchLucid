> **Scope:** Contributor-reference — wave-138 robustness controls for architecture create and review (branch `cursor/wave138-robustness-e14f`).

# Architecture create/review robustness — wave 138

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE137.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE137.md) (1629–1640 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 1641 | Run pin PATCH runtime **409** guard | `RunsController.CommitReplayPin.Pin.cs` — `PinRun`; `RunsController.SealedManifestGuard.cs` |
| 1642 | Run soft-archive POST runtime **409** mapper | `RunsController.Archive.cs` — `ArchiveRun`; sealed review blocked returns **409** |
| 1643 | Async replay POST runtime **409** guard | `RunsController.AsyncOperations.cs` — `ReplayRunAsync`; `RunsController.SealedManifestGuard.cs` |
| 1644 | Agent result submit POST runtime **409** mapper | `RunsController.cs` — `SubmitAgentResult`; `RunsController.SealedManifestGuard.cs` |
| 1645 | Comparison metadata PATCH runtime **409** guard | `ComparisonsController.History.cs` — `UpdateComparisonRecord`; `ComparisonsController.SealedManifestGuard.cs` |
| 1646 | Batch create POST runtime **409** mapper | `RunsController.Create.Batch.cs` — `CreateRunBatch` idempotency conflict |
| 1647 | Architecture request restore mutation `blockedReason` | `architecture-request-lifecycle-mutation-blocked-reason.ts`, `use-runs-dashboard-load-phase.ts` |
| 1648 | Architecture request clone/archive/delete API + shared `blockedReason` | `architecture-runs-lifecycle.ts`, `architecture-request-lifecycle-mutation-blocked-reason.ts` |
| 1649 | Review archive mutation `blockedReason` | `review-archive-mutation-blocked-reason.ts`, `ReviewArchiveControl.tsx` |
| 1650 | Authority replay mutation `blockedReason` | `review-replay-mutation-blocked-reason.ts`, `use-replay-form.ts` |
| 1651 | Comparison replay PDF mutation `blockedReason` | `comparison-replay-mutation-blocked-reason.ts`, `use-compare-results-panel.ts` |
| 1652 | Governance batch-review quick approve `blockedReason` | `governance-batch-review-mutation-blocked-reason.ts`, `GovernanceQuickApproveButton.tsx` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave138ArchitectureTests.cs`.

**Hasher baseline note:** wave 138 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** see [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE139.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE139.md) (1653–1664).
