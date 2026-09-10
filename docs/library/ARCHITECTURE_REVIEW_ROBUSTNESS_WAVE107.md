> **Scope:** Contributor-reference — wave-107 robustness controls for architecture create and review (branch `cursor/wave107-robustness-e14f`).

# Architecture create/review robustness — wave 107

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE106.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE106.md) (1257–1268 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 1269 | Finding remediation assignment PUT runtime **409** mapper | `FindingRemediationAssignmentController.cs` — `MapFindingRemediationAssignmentSealedManifestConflict` |
| 1270 | Audit export GET runtime **409** mapper | `AuditController.Export.Download.cs` — `MapAuditExportSealedManifestConflict` |
| 1271 | Audit export CSV GET runtime **409** mapper | `AuditController.Export.Csv.cs` — `MapAuditExportSealedManifestConflict` |
| 1272 | Pre-finalize checklist GET runtime **409** mapper | `GovernancePreCommitSimulationController.cs` — `MapPreCommitSimulationSealedManifestConflict` |
| 1273 | Internal trace forensics GET runtime **409** mapper | `InternalArchitectureTraceForensicsController.cs` — `MapTraceForensicsSealedManifestConflict` |
| 1274 | Run events SSE GET runtime **409** mapper | `AuthorityRunEventsController.cs` — `MapRunEventsSealedManifestConflict` |
| 1275 | Policy pack dry-run POST runtime **409** mapper | `GovernanceController.PolicyPacks.DryRun.cs` — `MapGovernanceSealedManifestConflict` |
| 1276 | Finding mute POST + unmute DELETE runtime **409** mapper | `FindingMuteController.cs`, `FindingMuteController.Unmute.cs` — `MapFindingMuteSealedManifestConflict` |
| 1277 | Finding unmute DELETE `blockedReason` | `finding-unmute-mutation-blocked-reason.ts`, `finding-unmute-client.ts` — `deleteFindingMute` |
| 1278 | Pre-finalize checklist GET `blockedReason` | `pre-finalize-checklist-blocked-reason.ts`, `pre-finalize-checklist.ts` — `getPreFinalizeChecklist` |
| 1279 | Run traces GET `blockedReason` | `run-agent-forensics-blocked-reason.ts`, `architecture-runs-read-detail-artifacts.ts` — `getRunTraces` |
| 1280 | Run tool-invocation forensics + agent evaluation GET `blockedReason` | same helper — `getRunToolInvocationForensics`, `getRunAgentEvaluation` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave107ArchitectureTests.cs`.

**Hasher baseline note:** wave 107 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** wave 86/90 guard-partial action-level mapper follow-ups — see [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE108.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE108.md) (1281–1292) when opened.
