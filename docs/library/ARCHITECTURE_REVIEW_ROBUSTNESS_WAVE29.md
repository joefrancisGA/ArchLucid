> **Scope:** Contributor-reference — wave-29 robustness controls for architecture create and review (branch `cursor/wave29-robustness-e14f`).

# Architecture create/review robustness — wave 29

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE28.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE28.md) (281–310 carryover batch).

| # | Control | Primary wiring |
|---|---------|----------------|
| 311 | DOCX compare-with run fail-closed on sealed hash | `RunExportSealedManifestHashGuard`, `DocxExportController.ExportRunDocx` |
| 312 | Decision receipt run build fail-closed on sealed hash | `RunExportSealedManifestHashGuard`, `DecisionReceiptService.BuildForRunAsync` |
| 313 | Architecture review board export fail-closed on sealed hash | `RunExportSealedManifestHashGuard`, `ArchitectureReviewExportService.GenerateReportAsync` |
| 314 | Structured diagram ingest fail-closed on sealed hash | `StructuredDiagramIngestSealedManifestHashGuard`, `StructuredDiagramIngestService.IngestAsync` |
| 315 | Diagram infrastructure reconciliation fail-closed on sealed hash | `DiagramInfrastructureReconciliationSealedManifestHashGuard`, `DiagramInfrastructureReconciliationService.ReconcileAsync` |
| 316 | First value sponsor report fail-closed on sealed hash | `RunExportSealedManifestHashGuard`, `FirstValueReportBuilder.BuildReportAsync` |
| 326 | Submitted architecture copy fail-closed | `run-collateral-sealed-manifest-guard.ts`, `RunDetailSubmittedArchitectureSection` |
| 327–328 | Architecture diagram Mermaid copy/download fail-closed | `run-collateral-sealed-manifest-guard.ts`, `use-architecture-diagram-panel.ts` |
| 329 | Finding IaC stub copy fail-closed | `run-collateral-sealed-manifest-guard.ts`, `FindingIacStubPanel` |
| 330–332 | Evidence graph JSON/Mermaid/PNG export fail-closed | `run-collateral-sealed-manifest-guard.ts`, `GraphLoadedExperience` |
| 333 | Golden manifest Markdown export fail-closed | `run-collateral-sealed-manifest-guard.ts`, `GoldenManifestExportMenu` |
| 334–335 | ADR modal and admin handoff copy blocked-reason UX | `GenerateAdrFromRunModal`, `ReviewPackageDoThisNextStrip` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave29ArchitectureTests.cs`.

Wave 30 Tier 1 continuation: [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE30.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE30.md).

**Hasher baseline note:** wave 29 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** remediation-instance guards (infra-evidence plane without run-scoped golden manifest), outbox metadata stretch (339–344), and infra-evidence cross-plane batch (345–350) remain for wave 30+. Wave 30 Tier 1 in [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE30.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE30.md).
