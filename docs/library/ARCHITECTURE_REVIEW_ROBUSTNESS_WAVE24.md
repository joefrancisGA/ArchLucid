> **Scope:** Contributor-reference — wave-24 robustness controls for architecture create and review (branch `cursor/wave24-robustness-e14f`).

# Architecture create/review robustness — wave 24

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE23.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE23.md) (suggestions 221–230).

| # | Control | Primary wiring |
|---|---------|----------------|
| 231 | Ask Q&A / ask-compare fail-closed on sealed hash + pin/inventory | `AskGroundedRunSealedManifestGuard`, `AskContextPreparer`, `AskService`, `AskController` |
| 232 | Advisory scan fail-closed on sealed hash | `AdvisoryScanSealedManifestGuard`, `AdvisoryScanRunner.ScheduleCore` |
| 233 | One-pager / run-summary / architecture-package DOCX sealed receipt | `SponsorOnePagerPdfBuilder`, `RunSummaryOnePagerExportService`, `DocxExportController` |
| 234 | Traceability-bundle ZIP sealed receipt + inventory | `TraceabilityBundleSealedReceiptGuard`, `TraceabilityBundleBuilder` |
| 235 | UI: consulting DOCX, first-value PDF, scoped-proxy GET reject JSON/problem bodies | `downloads-blob-trigger-reports.ts`, `downloads-blob-trigger-scoped-proxy.ts` |
| 236 | Risk-exception create/renew sealed hash | `GovernanceStickinessFacade.Findings.RiskExceptions` |
| 237 | ITSM outbound ticket create sealed hash + inventory-bound finding | `ItsmOutboundSealedManifestHashGuard`, `ItsmOutboundIssueCreationService` |
| 238 | Clarification / evidence-added / recommendation-improve re-review gate | Coordinators + `IReRunExecuteSealedManifestPinGate` |
| 239 | Run explain + finding-ask sealed hash / inventory | `ExplanationController.RunExplain`, `AskService.AskAboutFindingAsync`, `ArchitectureFindingAskController` |
| 240 | Export get/diff/replay sealed hash + lineage | `RunExportSealedManifestHashGuard`, `RunExportQueryFacade`, `ExportReplayService`, `ExportsController` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave24ArchitectureTests.cs`.

**Hasher baseline note:** wave 24 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).
