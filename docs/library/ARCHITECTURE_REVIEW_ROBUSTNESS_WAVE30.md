> **Scope:** Contributor-reference — wave-30 robustness controls for architecture create and review (branch `cursor/wave30-robustness-e14f`).

# Architecture create/review robustness — wave 30

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE29.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE29.md) (311–335 carryover batch).

| # | Control | Primary wiring |
|---|---------|----------------|
| 360 | Vision diagram ingest fail-closed on sealed hash | `VisionDiagramIngestSealedManifestHashGuard`, `VisionDiagramIngestService.IngestAsync` |
| 361 | Outbox drain guard for authority run failure / quality-gate events | `IntegrationEventOutboxManifestHashGuard` (`AuthorityRunFailedV1`, `AuthorityRunQualityGateRejectedV1`) |
| 362 | Authority run failure events emit verified manifestHash when committed | `RunIntegrationEventManifestHashResolver.TryResolveVerifiedManifestHashWhenCommittedOrNullAsync`, `ArchitectureRunIntegrationEventPublishing` |
| 363 | Finding remediation assignment fail-closed on sealed hash | `GovernanceDispositionSealedManifestGuard`, `FindingRemediationAssignmentController` |
| 364 | Run-scoped audit export fail-closed on sealed hash | `RunExportSealedManifestHashGuard`, `AuditController.ExportAuditCsv` / `ExportAudit` |
| 365 | Infra-evidence ask fail-closed when run-scoped | `InfraEvidenceAskSealedManifestHashGuard`, `InfraEvidenceAskGroundingService` |
| 366 | Run-scoped audit CSV export UI fail-closed | `run-collateral-sealed-manifest-guard.ts`, `RunScopedAuditExportButton` |
| 368 | Sponsor handoff DOCX export UI fail-closed | `run-collateral-sealed-manifest-guard.ts`, `ReviewPackageSponsorHandoffStrip` |
| 370 | Decision receipt export UI fail-closed | `run-collateral-sealed-manifest-guard.ts`, `DecisionReceiptExportButton` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave30ArchitectureTests.cs`.

**Hasher baseline note:** wave 30 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** compliance-drift escalation scanner/publisher job wiring (378 emitter call sites) remains for a follow-up when threshold scanning ships. Wave 31 Tier 1 continuation: [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE31.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE31.md).
