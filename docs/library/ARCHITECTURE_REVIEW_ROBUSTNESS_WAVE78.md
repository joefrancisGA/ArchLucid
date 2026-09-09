> **Scope:** Contributor-reference — wave-78 robustness controls for architecture create and review (branch `cursor/wave78-robustness-e14f`).

# Architecture create/review robustness — wave 78

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE77.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE77.md) (909–920 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 921 | Architecture package DOCX GET OpenAPI **409** | `DocxExportController.cs` — `ExportRunDocx`; `DocxExportController.SealedManifestGuard.cs` — `EnsureArchitecturePackageDocxSealedManifestAllowedAsync`, `EnsureCompareRunDocxSealedManifestAllowedAsync` |
| 922 | Technology ledger GET/PATCH OpenAPI **409** | `TechnologyLedgerController.cs`; `TechnologyLedgerController.SealedManifestGuard.cs` — `EnsureSealedManifestReadAllowedAsync` |
| 923 | Clarification questions GET/POST OpenAPI **409** | `ReviewClarificationQuestionsController.cs`; `ReviewClarificationQuestionsController.SealedManifestGuard.cs` |
| 924 | Evidence graph + temporal snapshot GET OpenAPI **409** | `GraphController.ReviewGraph.cs`, `GraphController.Snapshot.cs`; `GraphController.SealedManifestGuard.cs` — `EnsureGoldenManifestSealedReadAllowed` |
| 925 | Run query provenance/findings/detail OpenAPI **409** | `RunQueryController.Provenance.cs`, `.Findings.cs`, `.Detail.cs`; `RunQueryController.SealedManifestGuard.cs` — `EnsureSealedManifestReadAllowedAsync` |
| 926 | Infra-evidence snapshots OpenAPI **409** | `InfraEvidenceSnapshotsController.cs`; `InfraEvidenceSnapshotsController.SealedManifestGuard.cs` — `MapSnapshotSealedManifestConflict` / `InfraEvidenceSnapshotSealedManifestHashGuard` |
| 927 | Remediation instances OpenAPI **409** | `RemediationInstancesController.cs`; `RemediationInstancesController.SealedManifestGuard.cs` — `MapRemediationSealedManifestConflict` / `RemediationInstanceSealedManifestHashGuard` |
| 928 | Sponsor ROI CSV export `blockedReason` | `sponsor-roi-csv-export-mutation-blocked-reason.ts`, `SponsorRoiSummarySection.tsx` |
| 929 | Compare explain AI `blockedReason` | `compare-explain-mutation-blocked-reason.ts`, `CompareResultsPanelVerdictChrome.tsx` |
| 930 | Diagram ingest POST `blockedReason` | `diagram-ingest-mutation-blocked-reason.ts`, `DiagramReconcileWorkbenchClient.tsx` |
| 931 | Diagram reconcile POST `blockedReason` | `diagram-reconcile-mutation-blocked-reason.ts`, `DiagramReconcileWorkbenchClient.tsx` |
| 932 | Remediation workbench `blockedReason` | `remediation-instance-mutation-blocked-reason.ts`, `RemediationWorkbenchClient.tsx` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave78ArchitectureTests.cs`.

**Hasher baseline note:** wave 78 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** none — see [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE79.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE79.md) (933–944) when opened.
