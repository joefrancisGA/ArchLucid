> **Scope:** Contributor-reference — wave-85 robustness controls for architecture create and review (branch `cursor/wave85-robustness-e14f`).

# Architecture create/review robustness — wave 85

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE84.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE84.md) (993–1004 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 1005 | Diagram vision ingest POST OpenAPI **409** guard partial | `ArchitectureDiagramVisionIngestController.cs`; `ArchitectureDiagramVisionIngestController.SealedManifestGuard.cs` — `MapDiagramVisionIngestSealedManifestConflict` |
| 1006 | Diagram reconciliation GET/POST OpenAPI **409** guard partial | `ArchitectureDiagramReconciliationController.cs`; `ArchitectureDiagramReconciliationController.SealedManifestGuard.cs` — `MapDiagramReconcileSealedManifestConflict` |
| 1007 | Governance stickiness registers/dispositions/attestation OpenAPI **409** guard partial | `GovernanceStickinessController.Registers.cs`, `GovernanceStickinessController.Dispositions.cs`, `GovernanceStickinessController.Attestation.cs`; `GovernanceStickinessController.SealedManifestGuard.cs` — `MapGovernanceStickinessSealedManifestConflict` |
| 1008 | Policy pack simulate/assignment OpenAPI **409** guard partial | `PolicyPacksController.Simulate.cs`, `PolicyPacksController.Assignment.cs`; `PolicyPacksController.SealedManifestGuard.cs` — `MapPolicyPackSealedManifestConflict` |
| 1009 | Pilot pack read/export OpenAPI **409** guard partial | `PilotsController.Packs.cs`; `PilotsController.SealedManifestGuard.cs` — `MapPilotPackSealedManifestConflict` |
| 1010 | Draft request intake/admit OpenAPI **409** guard partial | `DraftRequestsController.cs`, `DraftRequestsController.Lifecycle.AdmitSubmit.cs`; `DraftRequestsController.SealedManifestGuard.cs` — `MapDraftRequestSealedManifestConflict` |
| 1011 | Architecture identity read/patch OpenAPI **409** guard partial | `ArchitecturesController.cs`; `ArchitecturesController.SealedManifestGuard.cs` — `MapArchitectureSealedManifestConflict` |
| 1012 | Architecture graph temporal snapshot load `blockedReason` | `architecture-graph-temporal-snapshot-blocked-reason.ts`, `graph-api.ts` — `getArchitectureGraphTemporalSnapshot` |
| 1013 | Pilot collateral download `blockedReason` | `pilots-collateral-mutation-blocked-reason.ts`, `pilots-collateral-download-api.ts` |
| 1014 | Run summary export download `blockedReason` | `run-summary-export-mutation-blocked-reason.ts`, `downloads-blob-trigger-run-summary-export.ts` |
| 1015 | Artifact bundle download `blockedReason` | `artifact-bundle-mutation-blocked-reason.ts`, `downloads-blob-trigger-artifact-bundle.ts` |
| 1016 | Manifest compare export download `blockedReason` | `manifest-compare-export-mutation-blocked-reason.ts`, `downloads-blob-trigger-manifest-compare-export.ts` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave85ArchitectureTests.cs`.

**Hasher baseline note:** wave 85 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** none — see [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE86.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE86.md) (1017–1028).
