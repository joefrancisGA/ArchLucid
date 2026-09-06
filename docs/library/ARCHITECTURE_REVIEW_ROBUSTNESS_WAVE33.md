> **Scope:** Contributor-reference — wave-33 robustness controls for architecture create and review (branch `cursor/wave33-robustness-e14f`).

# Architecture create/review robustness — wave 33

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE32.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE32.md) (378 carryover; wave 29 outbox metadata stretch 339–344 partially landed here).

| # | Control | Primary wiring |
|---|---------|----------------|
| 379 | Architecture analysis report build fail-closed on sealed hash | `ArchitectureAnalysisSealedManifestHashGuard`, `ArchitectureAnalysisService.BuildAsync` |
| 380 | Analysis export endpoints inherit build guard + 409 on conflict | `ArchitectureAnalysisService`, `AnalysisReportsController.AnalyzeExport` |
| 381 | Run detail header package export UI fail-closed | `run-collateral-sealed-manifest-guard.ts`, `RunDetailPageHeader` |
| 382 | Findings ITSM CSV/JSON export UI fail-closed when committed | `run-collateral-sealed-manifest-guard.ts`, `FindingsItsmExportToolbar` |
| 383 | Cloud resource evidence hub fail-closed when run-scoped | `CloudResourceEvidenceHubSealedManifestHashGuard`, `CloudResourceEvidenceHubService` |
| 384 | Retrieval indexing outbox drain fail-closed on sealed hash | `RetrievalIndexingOutboxSealedManifestHashGuard`, `RetrievalIndexingOutboxProcessor` |
| 385 | Manifest-finalized outbox payload uses verified manifestHash | `RunIntegrationEventManifestHashResolver`, `ManifestFinalizationService` |
| 386 | Authority-run-completed outbox payload uses verified manifestHash | `RunIntegrationEventManifestHashResolver`, `AuthorityCommittedPipelineFinalizer` |
| 387 | Policy-pack published outbox drain skips hash when no runId | `IntegrationEventOutboxManifestHashGuard` |
| 388 | Webhook simulation samples include manifestHash on run-scoped payloads | `IntegrationWebhookPayloadSamples` |
| 389 | Sponsor ROI findings CSV UI fail-closed when scoped review unsealed | `run-collateral-sealed-manifest-guard.ts`, `SponsorRoiSummarySection` |
| 390 | Cosmos graph snapshot outbox drain fail-closed on sealed hash | `CosmosGraphSnapshotOutboxSealedManifestHashGuard`, `CosmosGraphSnapshotOutboxProcessor` |
| 391 | Advisory scan completed emitter uses verified manifestHash | `RunIntegrationEventManifestHashResolver`, `AdvisoryScanRunner.ScheduleCore` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave33ArchitectureTests.cs`.

**Hasher baseline note:** wave 33 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** wave 29 infra-evidence cross-plane batch (345–350) ships in [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE34.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE34.md).
