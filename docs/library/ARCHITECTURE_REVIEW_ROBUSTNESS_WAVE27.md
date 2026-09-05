> **Scope:** Contributor-reference — wave-27 robustness controls for architecture create and review (branch `cursor/wave27-robustness-e14f`).

# Architecture create/review robustness — wave 27

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE26.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE26.md) (wave-26 carryover batch).

| # | Control | Primary wiring |
|---|---------|----------------|
| 259 | Alert simulation primary run fail-closed on sealed hash | `AlertSimulationSealedManifestHashGuard`, `AlertSimulationController` |
| 260 | Alert simulation compare-to run fail-closed on sealed hash | `AlertSimulationSealedManifestHashGuard`, `AlertSimulationController.CompareCandidates` |
| 261 | Alert simulation multi-run sweep skips unverified runs | `AlertSimulationContextProvider`, `AlertSimulationSealedManifestHashGuard.TryEnsureRunSealedManifestHash` |
| 263 | Production alert evaluate fail-closed on sealed hash | `AlertEvaluateSealedManifestHashGuard`, `AlertService` |
| 264 | Composite alert evaluate fail-closed on sealed hash | `AlertEvaluateSealedManifestHashGuard`, `CompositeAlertService` |
| 265 | Alert persist re-verify fail-closed on sealed hash | `AlertPersistSealedManifestHashGuard`, `AlertService` / `CompositeAlertService` |
| 266 | Alert integration outbox `manifestHash` metadata | `AlertIntegrationEventManifestHashResolver`, `AlertIntegrationEventPublishing` |
| 267 | Alert outbox drain guard for alert event types | `IntegrationEventOutboxManifestHashGuard` (`AlertFiredV1`, `AlertAcknowledgedV1`, `AlertResolvedV1`) |
| 272 | Sponsor ROI multi-run rollup fail-closed on sealed hash | `SponsorRoiBoardPackSealedManifestGuard.EnsureRunIdsSealedOrThrowAsync`, ROI builders |
| 277 | Sponsor ROI JSON GET fail-closed on sealed hash | `SponsorRoiSummaryBuilder`, `SponsorRoiHistoryBuilder`, `RoiController` |
| 278 | Sponsor ROI export fail-closed on sealed hash | `SponsorRoiExportBuilder`, `RoiController` |
| 279 | Governance insights/posture fail-closed on sealed hash | `GovernanceInsightsSealedManifestHashGuard`, `GovernancePostureSealedManifestHashGuard` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave27ArchitectureTests.cs`.

**Hasher baseline note:** wave 27 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred to wave 29+:** stretch items beyond 281–310 from wave-26 planning notes. Shipped in [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE28.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE28.md).
