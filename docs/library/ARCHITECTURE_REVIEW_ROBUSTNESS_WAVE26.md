> **Scope:** Contributor-reference — wave-26 robustness controls for architecture create and review (branch `cursor/wave26-robustness-e14f`).

# Architecture create/review robustness — wave 26

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE25.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE25.md) (suggestions 241–250). Successor: [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE27.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE27.md) (259–279 carryover batch).

| # | Control | Primary wiring |
|---|---------|----------------|
| 251 | Pre-finalize checklist GET fail-closed on sealed hash | `PreCommitSimulationSealedManifestHashGuard`, `GovernancePreCommitSimulationController` |
| 252 | Pre-commit synthetic simulation POST fail-closed on sealed hash | `PreCommitSimulationSealedManifestHashGuard`, `GovernancePreCommitSimulationController` |
| 253 | Governance preview activation fail-closed on sealed hash | `GovernancePreviewSealedManifestHashGuard`, `GovernancePreviewService` |
| 254 | Governance environment compare fail-closed on sealed hashes | `GovernancePreviewSealedManifestHashGuard`, `GovernancePreviewService` |
| 255 | Recurrence schedule create fail-closed on source run sealed hash | `RecurrenceScheduleCreateSealedManifestHashGuard`, `GovernanceStickinessFacade.Recurrence` |
| 256 | Draft snapshot clone fail-closed on spawned-run sealed hash | `DraftSnapshotCloneSealedManifestHashGuard`, `DraftSnapshotCloningService` |
| 257 | Internal authority replay fail-closed before rebuild | `AuthorityReplaySealedManifestHashGuard`, `AuthorityReplayService` |
| 258 | Replay prepare fail-closed before clone side effects | `ReplayRunPrepareSealedManifestHashGuard`, `ReplayRunPrepareStage` |
| 262 | Alert Teams/Slack webhook delivery fail-closed on run sealed hash | `AlertDeliverySealedManifestHashGuard`, `AlertDeliveryDispatcher` |
| 268 | Exec digest email dispatch re-verify sealed hash before send | `ExecDigestEmailDispatchSealedManifestHashGuard`, `ExecDigestWeeklyDeliveryScanner` |
| 269 | UI governance/trace work-item copy fail-closed on sealed hash | `finding-work-item-sealed-manifest-guard.ts`, `CopyFindingAsWorkItemButton.tsx` |
| 270 | Run trust evidence card fail-closed on sealed hash | `RunTrustEvidenceSealedManifestHashGuard`, `RunTrustEvidenceCardBuilder` |
| 271 | Advisory scan compare-to baseline run fail-closed on sealed hash | `AdvisoryScanCompareToSealedManifestHashGuard`, `AdvisoryScanRunner.ScheduleCore` |
| 273 | Comparison drift analyze fail-closed on sealed hash | `ComparisonReplayManifestHashGuard`, `ComparisonReplayService.AnalyzeDriftAsync` |
| 274 | Bulk ITSM JSON clipboard export UI fail-closed | `run-findings-itsm-export.ts`, `FindingsItsmExportToolbar` consumers |
| 275 | Manifest version compare GET/export fail-closed on sealed hash | `ManifestVersionCompareSealedManifestHashGuard`, `ManifestsController.Compare` |
| 276 | Advisory improvements plan fail-closed on primary + compare-to runs | `AdvisoryImprovementsPlanSealedManifestHashGuard`, `AdvisoryWorkflowFacade.Improvements` |
| 280 | CreateWorkItem dialog open fail-closed on sealed hash | `CreateWorkItemButton.tsx`, `finding-work-item-sealed-manifest-guard.ts` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave26ArchitectureTests.cs`.

**Hasher baseline note:** wave 26 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred to wave 27+:** 259–261, 263–267, 272, 277–279 (multi-run aggregation, alert evaluate/persist/outbox metadata, sponsor ROI server exports, governance insights/posture). Shipped in [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE27.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE27.md).
