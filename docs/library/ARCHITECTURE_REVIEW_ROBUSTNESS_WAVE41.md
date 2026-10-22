> **Scope:** Contributor-reference — wave-41 robustness controls for architecture create and review (branch `cursor/wave41-robustness-e14f`).

# Architecture create/review robustness — wave 41

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE40.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE40.md) (465–476 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 477 | Audit evidence **lineage** sealed-manifest **409 UX** | `audit-evidence-lineage-api.ts`, `audit-evidence-lineage-blocked-reason.ts`, `AuditEvidenceControlLineageClient.tsx` |
| 478 | Audit evidence **package ZIP** client + **409 UX** | `audit-evidence-package-api.ts`, `AuditEvidenceControlLineageClient.tsx` |
| 479 | **Governance preview** OpenAPI **409** | `GovernancePreviewController.cs` |
| 480 | **DOCX architecture-package** OpenAPI **409** | `DocxExportController.cs` |
| 481 | **Consulting DOCX analyze** OpenAPI **409** | `AnalysisReportsController.ConsultingDocx.Download.cs` |
| 482 | **Pilots board-pack PDF** OpenAPI **409** | `PilotsBoardPackController.cs` |
| 483 | **ROI sponsor-report board-pack** OpenAPI **409** | `RoiController.cs` |
| 484 | **Traceability bundle** legacy alias OpenAPI **409** | `RunQueryController.Findings.cs` |
| 485 | **Pre-commit simulation** OpenAPI **409** | `GovernancePreCommitSimulationController.cs` |
| 486 | **Decision receipt export** stamp/feasibility `manifestVersion` fail-closed | `RunDetailReviewPackageDecisionReceiptStrip.tsx`, `RunDetailFeasibilityVerdictSection.tsx` |
| 487 | **Trust evidence proof chain** traceability link fail-closed | `RunTrustEvidenceProofChain.tsx`, `RunTrustEvidenceCardSection.tsx` |
| 488 | **BeforeAfter + board-pack** ROI/409 honesty | `BeforeAfterDeltaPanel.tsx`, `sponsor-roi-board-pack-api.ts`, `downloads-blob-trigger-reports.ts`, `export-sealed-manifest-conflict.ts` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave41ArchitectureTests.cs`.

**Hasher baseline note:** wave 41 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** see [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE42.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE42.md) (489–500).
