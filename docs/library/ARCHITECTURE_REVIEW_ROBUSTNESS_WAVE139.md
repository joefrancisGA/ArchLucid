> **Scope:** Contributor-reference — wave-139 robustness controls for architecture create and review (branch `cursor/wave139-robustness-e14f`).

# Architecture create/review robustness — wave 139

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE138.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE138.md) (1641–1652 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 1653 | Architecture request sync create POST runtime **409** mapper | `RunsController.Create.Sync.cs` — `CreateRun`; `RunsController.SealedManifestGuard.cs` — `EnsureArchitectureRunCreateSealedManifestAllowedAsync` |
| 1654 | Architecture request async create POST runtime **409** mapper | `RunsController.AsyncOperations.cs` — `AcceptCreateRunAsync`; `RunsController.SealedManifestGuard.cs` |
| 1655 | Authority replay POST runtime **409** mapper | `AuthorityReplayController.cs` — `Replay`; `AuthorityReplayController.SealedManifestGuard.cs` |
| 1656 | Governance mutation correction POST runtime **409** mapper | `GovernanceController.MutationCorrections.cs` — `RecordGovernanceMutationCorrection`; `GovernanceController.SealedManifestGuard.cs` |
| 1657 | Sponsor pack-sent POST runtime **409** mapper | `PilotsController.Packs.cs` — `PostSponsorPackSent`; `PilotsController.SealedManifestGuard.cs` |
| 1658 | Sponsor preliminary-share POST runtime **409** mapper | `PilotsController.Packs.cs` — `PostSponsorPreliminaryShare`; `PilotsController.SealedManifestGuard.cs` |
| 1659 | Run pin mutation `blockedReason` + UX | `review-pin-mutation-blocked-reason.ts`, `use-review-pin-mutation.ts`, `FavoriteReviewToggle.tsx`, `architecture-runs-lifecycle.ts` |
| 1660 | Sponsor preliminary-share mutation `blockedReason` | `sponsor-preliminary-share-mutation-blocked-reason.ts`, `ArchitectureSponsorSharingPanel.tsx` |
| 1661 | Sponsor pack-sent mutation `blockedReason` | `sponsor-pack-sent-mutation-blocked-reason.ts`, `use-email-run-to-sponsor-banner.ts` |
| 1662 | First-value report PDF mutation `blockedReason` | `first-value-report-mutation-blocked-reason.ts`, `use-email-run-to-sponsor-banner.ts` |
| 1663 | Compare package DOCX download mutation `blockedReason` | `comparison-docx-mutation-blocked-reason.ts`, `use-compare-results-panel.ts` |
| 1664 | Async replay POST mutation `blockedReason` | `review-async-replay-mutation-blocked-reason.ts`, `replayArchitectureRunAsync` in `architecture-runs-lifecycle.ts`, `use-replay-form.ts` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave139ArchitectureTests.cs`.

**Hasher baseline note:** wave 139 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** see [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE140.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE140.md) (1665–1676) for wave-72 follow-ups (849–860).
