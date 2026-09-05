> **Scope:** Contributor-reference — wave-28 robustness controls for architecture create and review (branch `cursor/wave28-robustness-e14f`).

# Architecture create/review robustness — wave 28

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE27.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE27.md) (259–279 carryover batch).

| # | Control | Primary wiring |
|---|---------|----------------|
| 281 | Single finding disposition fail-closed on sealed hash | `GovernanceDispositionSealedManifestGuard`, `GovernanceStickinessFacade.Findings.Dispositions` |
| 282 | Bulk finding disposition fail-closed on sealed hash | `GovernanceDispositionSealedManifestGuard`, `GovernanceStickinessFacade.Findings.Dispositions` |
| 283 | Compare run-pair load fail-closed on sealed hash | `CompareRunsSealedManifestHashGuard`, `CompareRunsApplicationFacade.PairLoad` |
| 284 | Compare manifest load fail-closed on sealed hash | `CompareRunsSealedManifestHashGuard`, `CompareRunsApplicationFacade.ManifestCompare` |
| 285 | E2E replay compare sealed hash mismatch | `EndToEndReplayComparisonService`, `CompareRunsResults` |
| 286 | Compare API maps sealed hash mismatch to 409 | `ComparisonController`, `ManifestsController.Compare`, `RunComparisonController.Agents`, `ExplanationController.CompareHolistic` |
| 287 | Authority manifest-id compare fail-closed on sealed hash | `AuthorityManifestIdCompareSealedManifestHashGuard`, `AuthorityCompareController` |
| 288 | Findings CSV export fail-closed on sealed hash | `RunExportSealedManifestHashGuard`, `RunFindingsCsvExportStage` |
| 289 | Commit sponsor email dispatch re-verify sealed hash | `CommitSponsorEmailDispatchSealedManifestHashGuard`, `CommitSponsorEmailNotifier` |
| 290 | Advisory recommendation apply fail-closed on sealed hash | `AdvisoryApplySealedManifestHashGuard`, `AdvisoryWorkflowFacade.Apply` |
| 291 | Advisory digest read fail-closed on sealed hash | `AdvisoryDigestReadSealedManifestHashGuard`, `AdvisorySchedulingController.Digests` |
| 292 | Batch replay pin/inventory guard handles sealed hash mismatch | `ComparisonBatchReplayPinInventoryGuard` |
| 293 | Findings high-severity integration event `manifestHash` metadata | `RunIntegrationEventManifestHashResolver`, `FindingsIntegrationEventPublishing` |
| 294 | Governance approval submitted `manifestHash` metadata | `RunIntegrationEventManifestHashResolver`, `GovernanceWorkflowIntegrationEventSupport` |
| 295 | Governance approval approved/rejected `manifestHash` metadata | `GovernanceWorkflowIntegrationEventSupport` |
| 296 | Governance promotion activated `manifestHash` metadata | `GovernanceWorkflowIntegrationEventSupport` |
| 297 | Execute outbox failure/quality-gate optional `manifestHash` metadata | `RunIntegrationEventManifestHashResolver`, `ArchitectureRunIntegrationEventPublishing` |
| 298 | Outbox drain guard for findings event type | `IntegrationEventOutboxManifestHashGuard` (`FindingsHighSeverityCapturedV1`) |
| 299 | Outbox drain guard for governance event types | `IntegrationEventOutboxManifestHashGuard` (approval + promotion types) |
| 300–310 | UI run-collateral clipboard/export fail-closed | `run-collateral-sealed-manifest-guard.ts`, `CopyManifestButton`, `CopyForAiAssistantButton`, `GenerateAdrFromRunModal`, `PilotRoiValidationHandoffCard` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave28ArchitectureTests.cs`.

**Hasher baseline note:** wave 28 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).
