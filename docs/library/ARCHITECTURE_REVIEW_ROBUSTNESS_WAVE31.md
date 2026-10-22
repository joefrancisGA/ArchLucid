> **Scope:** Contributor-reference — wave-31 robustness controls for architecture create and review (branch `cursor/wave31-robustness-e14f`).

# Architecture create/review robustness — wave 31

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE30.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE30.md) (360–370 carryover batch).

| # | Control | Primary wiring |
|---|---------|----------------|
| 356 | Remediation instance create fail-closed on sealed hash | `RemediationInstanceSealedManifestHashGuard`, `RemediationInstanceService.CreateFromMatchAsync` |
| 357 | Remediation preflight / approve fail-closed on sealed hash | `RemediationInstanceSealedManifestHashGuard`, `RemediationInstanceService.RunPreflightAsync` / `ApproveAsync` |
| 358 | Remediation wave assign / execute fail-closed on sealed hash | `RemediationInstanceSealedManifestHashGuard`, `RemediationInstanceService.AssignWaveAsync` / `ExecuteAsync` |
| 359 | Remediation verify / close fail-closed on sealed hash | `RemediationInstanceSealedManifestHashGuard`, `RemediationInstanceService.VerifyAsync` / `CloseAsync` |
| 367 | Run detail deliverables export row UI fail-closed | `run-collateral-sealed-manifest-guard.ts`, `RunDetailArtifactsExportsSection` |
| 369 | Header share / meeting-packet export UI fail-closed | `run-collateral-sealed-manifest-guard.ts`, `ReviewHeaderShareMenu`, `ReviewMeetingPacketButton` |
| 371 | Manifest JSON download UI fail-closed | `run-collateral-sealed-manifest-guard.ts`, `DownloadManifestButton` |
| 372 | Consulting DOCX export UI fail-closed | `run-collateral-sealed-manifest-guard.ts`, `ConsultingDocxExportButton`, `ReviewBoardWhitelabelConsultingExportButton` |
| 373 | Terraform advisory ZIP export UI fail-closed | `run-collateral-sealed-manifest-guard.ts`, `ExportTerraformAdvisoryButton` |
| 374 | Traceability bundle / sponsor dashboard / email sponsor exports UI fail-closed | `run-collateral-sealed-manifest-guard.ts`, `RunDetailRunActionsSection`, `SponsorExportsSection`, `EmailRunToSponsorExportActions` |
| 378 | Compliance-drift outbox metadata when run-scoped | `ComplianceDriftIntegrationEventPublishing`, `IntegrationEventOutboxManifestHashGuard` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave31ArchitectureTests.cs`.

**Hasher baseline note:** wave 31 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** wave 29 infra-evidence cross-plane batch (345–350) remains for a follow-up wave. Wave 32 ships 378 emitter call sites in [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE32.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE32.md). Wave 33 ships 379–391 in [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE33.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE33.md).
