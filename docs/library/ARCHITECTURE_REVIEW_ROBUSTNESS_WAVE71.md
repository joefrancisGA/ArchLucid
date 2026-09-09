> **Scope:** Contributor-reference — wave-71 robustness controls for architecture create and review (branch `cursor/wave71-robustness-e14f`).

# Architecture create/review robustness — wave 71

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE70.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE70.md) (825–836 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 837 | Architecture request sync create POST OpenAPI **409** | `RunsController.Create.Sync.cs` — `CreateRun`; `RunsController.SealedManifestGuard.cs` — `EnsureArchitectureRunCreateSealedManifestAllowedAsync` |
| 838 | Architecture request async create POST OpenAPI **409** | `RunsController.AsyncOperations.cs` — `AcceptCreateRunAsync`; `RunsController.SealedManifestGuard.cs` |
| 839 | Authority replay POST OpenAPI **409** | `AuthorityReplayController.cs` — `Replay`; `AuthorityReplayController.SealedManifestGuard.cs` |
| 840 | Governance mutation correction POST OpenAPI **409** | `GovernanceController.MutationCorrections.cs` — `RecordGovernanceMutationCorrection`; `GovernanceController.SealedManifestGuard.cs` |
| 841 | Sponsor pack-sent POST OpenAPI **409** | `PilotsController.Packs.cs` — `PostSponsorPackSent`; `PilotsController.SealedManifestGuard.cs` |
| 842 | Sponsor preliminary-share POST OpenAPI **409** | `PilotsController.Packs.cs` — `PostSponsorPreliminaryShare`; `PilotsController.SealedManifestGuard.cs` |
| 843 | Run pin mutation `blockedReason` + UX | `review-pin-mutation-blocked-reason.ts`, `use-review-pin-mutation.ts`, `FavoriteReviewToggle.tsx`, `architecture-runs-lifecycle.ts` |
| 844 | Sponsor preliminary-share mutation `blockedReason` | `sponsor-preliminary-share-mutation-blocked-reason.ts`, `ArchitectureSponsorSharingPanel.tsx` |
| 845 | Sponsor pack-sent mutation `blockedReason` | `sponsor-pack-sent-mutation-blocked-reason.ts`, `use-email-run-to-sponsor-banner.ts` |
| 846 | First-value report PDF mutation `blockedReason` | `first-value-report-mutation-blocked-reason.ts`, `use-email-run-to-sponsor-banner.ts` |
| 847 | Compare package DOCX download mutation `blockedReason` | `comparison-docx-mutation-blocked-reason.ts`, `use-compare-results-panel.ts` |
| 848 | Async replay POST mutation `blockedReason` | `review-async-replay-mutation-blocked-reason.ts`, `replayArchitectureRunAsync` in `architecture-runs-lifecycle.ts`, `use-replay-form.ts` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave71ArchitectureTests.cs`.

**Hasher baseline note:** wave 71 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** none.
