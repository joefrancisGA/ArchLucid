> **Scope:** Contributor-reference — wave-87 robustness controls for architecture create and review (branch `cursor/wave87-robustness-e14f`).

# Architecture create/review robustness — wave 87

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE86.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE86.md) (1017–1028 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 1029 | Finding remediation assignment PUT OpenAPI **409** guard partial | `FindingRemediationAssignmentController.cs`; `FindingRemediationAssignmentController.SealedManifestGuard.cs` — `MapFindingRemediationAssignmentSealedManifestConflict` |
| 1030 | Audit export GET OpenAPI **409** guard partial | `AuditController.Export.Download.cs`, `AuditController.Export.Csv.cs`; `AuditController.SealedManifestGuard.cs` — `MapAuditExportSealedManifestConflict` |
| 1031 | Pre-commit simulation GET/POST OpenAPI **409** guard partial | `GovernancePreCommitSimulationController.cs`; `GovernancePreCommitSimulationController.SealedManifestGuard.cs` — `MapPreCommitSimulationSealedManifestConflict` |
| 1032 | Internal trace forensics GET OpenAPI **409** guard partial | `InternalArchitectureTraceForensicsController.cs`; `InternalArchitectureTraceForensicsController.SealedManifestGuard.cs` — `MapTraceForensicsSealedManifestConflict` |
| 1033 | Run summary SSE GET OpenAPI **409** guard partial | `AuthorityRunEventsController.cs`; `AuthorityRunEventsController.SealedManifestGuard.cs` — `MapRunEventsSealedManifestConflict` |
| 1034 | Governance dry-run/simulate/insights OpenAPI **409** guard partial | `GovernanceController.PolicyPacks.DryRun.cs`, `GovernanceController.PolicyPacks.Simulate.cs`, `GovernanceController.Insights.cs`; `GovernanceController.SealedManifestGuard.cs` — `MapGovernanceSealedManifestConflict` |
| 1035 | Finding mute POST OpenAPI **409** guard partial | `FindingMuteController.cs`; `FindingMuteController.SealedManifestGuard.cs` — `MapFindingMuteSealedManifestConflict` |
| 1036 | Draft decision receipt JSON download `blockedReason` | `architecture-draft-blocked-reason.ts`, `downloads-blob-trigger-draft-decision-receipt.ts` — `downloadDraftDecisionReceiptJson` |
| 1037 | Per-artifact download `blockedReason` | `export-record-blocked-reason.ts`, `downloads-blob-trigger-artifact-single.ts` — `downloadArtifactFile` |
| 1038 | Retrieval grounding JSON download `blockedReason` | `run-retrieval-grounding-blocked-reason.ts`, `downloads-blob-trigger-retrieval-grounding-json.ts` — `downloadRunRetrievalGroundingJson` |
| 1039 | Run export blob push `blockedReason` | `run-export-blob-push-mutation-blocked-reason.ts`, `run-export-blob-push-api.ts` — `pushRunExportToBlob` |
| 1040 | Finding remediation assignment PUT `blockedReason` | `finding-remediation-assignment-blocked-reason.ts`, `finding-remediation-assignment-api.ts` — `upsertFindingRemediationAssignment` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave87ArchitectureTests.cs`.

**Hasher baseline note:** wave 87 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** none — see [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE88.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE88.md) (1041–1052) when opened.
