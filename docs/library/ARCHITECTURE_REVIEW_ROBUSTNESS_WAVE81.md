> **Scope:** Contributor-reference — wave-81 robustness controls for architecture create and review (branch `cursor/wave81-robustness-e14f`).

# Architecture create/review robustness — wave 81

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE80.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE80.md) (945–956 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 957 | Finding remediation assignment PUT OpenAPI **409** | `FindingRemediationAssignmentController.cs`; `FindingRemediationAssignmentController.SealedManifestGuard.cs` — `EnsureFindingRemediationAssignmentSealedManifestAllowedAsync` |
| 958 | Audit export GET OpenAPI **409** | `AuditController.Export.Download.cs`; `AuditController.SealedManifestGuard.cs` — `EnsureAuditExportSealedManifestAllowedAsync` |
| 959 | Audit CSV export GET OpenAPI **409** | `AuditController.Export.Csv.cs`; `AuditController.SealedManifestGuard.cs` |
| 960 | Pre-commit simulation GET/POST OpenAPI **409** | `GovernancePreCommitSimulationController.cs`; `GovernancePreCommitSimulationController.SealedManifestGuard.cs` — `EnsurePreCommitSimulationSealedManifestAllowedAsync` |
| 961 | Infra-evidence Ask POST OpenAPI **409** | `InfraEvidenceAskController.cs`; `InfraEvidenceAskController.SealedManifestGuard.cs` — `MapAskSealedManifestConflict` |
| 962 | Audit evidence lineage GET OpenAPI **409** | `AuditEvidenceLineageController.cs`; `AuditEvidenceLineageController.SealedManifestGuard.cs` — `MapAuditEvidenceLineageSealedManifestConflict` |
| 963 | Audit evidence package ZIP GET OpenAPI **409** | `AuditEvidencePackageController.cs`; `AuditEvidencePackageController.SealedManifestGuard.cs` — `MapAuditEvidencePackageSealedManifestConflict` |
| 964 | Audit evidence package download `blockedReason` | `audit-evidence-package-blocked-reason.ts`, `audit-evidence-package-api.ts` |
| 965 | Audit evidence package download UX | `AuditEvidenceControlLineageClient.tsx` — `auditEvidencePackageBlockedReason` |
| 966 | Sponsor ROI board pack `blockedReason` | `sponsor-roi-board-pack-mutation-blocked-reason.ts`, `sponsor-roi-board-pack-api.ts` |
| 967 | Findings CSV export `blockedReason` | `run-findings-csv-export-blocked-reason.ts`, `findings-api.ts` — `downloadRunFindingsCsv` |
| 968 | Sponsor ROI summary load `blockedReason` | `sponsor-roi-summary-blocked-reason.ts`, `SponsorRoiSummarySection.tsx` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave81ArchitectureTests.cs`.

**Hasher baseline note:** wave 81 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** none — wave 82 (969–980) opens when the next robustness batch lands.
