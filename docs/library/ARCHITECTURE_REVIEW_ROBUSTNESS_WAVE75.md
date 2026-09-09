> **Scope:** Contributor-reference — wave-75 robustness controls for architecture create and review (branch `cursor/wave75-robustness-e14f`).

# Architecture create/review robustness — wave 75

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE74.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE74.md) (873–884 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 885 | Pilot run-deltas GET OpenAPI **409** | `PilotsController.Deltas.cs` — `GetPilotRunDeltas`; `PilotsController.SealedManifestGuard.cs` — `EnsureRunSealedManifestReadAllowedAsync` |
| 886 | Pilot closeout POST OpenAPI **409** | `PilotsController.Closeout.cs` — `PostCloseout`; `PilotsController.SealedManifestGuard.cs` |
| 887 | Finding mute POST OpenAPI **409** | `FindingMuteController.cs` — `PostMuteAsync`; `FindingMuteController.SealedManifestGuard.cs` — `EnsureFindingMuteRunSealedManifestAllowedAsync` |
| 888 | Consulting DOCX async export POST OpenAPI **409** | `AnalysisReportsController.ConsultingDocx.AsyncRecommend.cs` — `DownloadConsultingDocxAsync`; `AnalysisReportsController.SealedManifestGuard.cs` |
| 889 | Policy-pack threshold dry-run POST OpenAPI **409** | `GovernanceController.PolicyPacks.DryRun.cs` — `DryRunPolicyPack`; `GovernanceController.SealedManifestGuard.cs` — `EnsureDryRunRunIdsSealedManifestReadAllowedAsync` |
| 890 | Governance `/simulate` POST OpenAPI **409** | `GovernanceController.PolicyPacks.Simulate.cs` — `Simulate`; `GovernanceController.SealedManifestGuard.cs` |
| 891 | Proposed policy-pack dry-run POST OpenAPI **409** | `GovernanceController.PolicyPacks.DryRun.cs` — `DryRunProposedPolicyPack`; `GovernanceController.SealedManifestGuard.cs` |
| 892 | Decision receipt JSON download `blockedReason` | `decision-receipt-mutation-blocked-reason.ts`, `DecisionReceiptExportButton.tsx` |
| 893 | Terraform advisory ZIP export `blockedReason` | `terraform-advisory-export-mutation-blocked-reason.ts`, `ExportTerraformAdvisoryButton.tsx` |
| 894 | Policy-pack dry-run modal `blockedReason` | `policy-pack-dry-run-mutation-blocked-reason.ts`, `GovernanceDryRunModal.tsx` |
| 895 | Pilot run-deltas read `blockedReason` | `pilot-run-deltas-blocked-reason.ts`, `use-pilot-run-deltas-query.ts`, `BeforeAfterDeltaPanel.tsx`, `use-email-run-to-sponsor-banner.ts`, `RunDetailAiReadinessGateCard.tsx` |
| 896 | Finding mute mutation `blockedReason` | `finding-mute-mutation-blocked-reason.ts`, `QuickDecisionFindingMuteDialog.tsx` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave75ArchitectureTests.cs`.

**Hasher baseline note:** wave 75 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** none.
