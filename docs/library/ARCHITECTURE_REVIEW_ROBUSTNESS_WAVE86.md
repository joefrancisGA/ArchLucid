> **Scope:** Contributor-reference — wave-86 robustness controls for architecture create and review (branch `cursor/wave86-robustness-e14f`).

# Architecture create/review robustness — wave 86

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE85.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE85.md) (1005–1016 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 1017 | Governance stickiness **risk-exception** OpenAPI **409** guard partial | `GovernanceStickinessController.Exceptions.cs`; `GovernanceStickinessController.SealedManifestGuard.cs` — `MapGovernanceStickinessSealedManifestConflict` |
| 1018 | Governance stickiness **recurrence-schedule** OpenAPI **409** guard partial | `GovernanceStickinessController.Schedules.cs`; `GovernanceStickinessController.SealedManifestGuard.cs` — `MapGovernanceStickinessSealedManifestConflict` |
| 1019 | Evidence graph + temporal snapshot GET OpenAPI **409** guard partial | `GraphController.ReviewGraph.cs`, `GraphController.Snapshot.cs`; `GraphController.SealedManifestGuard.cs` — `MapGraphSealedManifestConflict` |
| 1020 | Product run-query provenance/findings/detail GET OpenAPI **409** guard partial | `RunQueryController.Provenance.cs`, `RunQueryController.Findings.cs`, `RunQueryController.Detail.cs`; `RunQueryController.SealedManifestGuard.cs` — `MapProductRunQuerySealedManifestConflict` |
| 1021 | Explanation run/finding/holistic GET OpenAPI **409** guard partial | `ExplanationController.RunExplain.cs`, `ExplanationController.FindingExplain.cs`, `ExplanationController.CompareHolistic.cs`; `ExplanationController.SealedManifestGuard.cs` — `MapExplanationSealedManifestConflict` |
| 1022 | Run coverage GET/ack OpenAPI **409** guard partial | `RunCoverageController.cs`, `RunCoverageController.Acknowledgement.cs`; `RunCoverageController.SealedManifestGuard.cs` — `MapRunCoverageSealedManifestConflict` |
| 1023 | Run agent evaluation GET OpenAPI **409** guard partial | `RunAgentEvaluationController.cs`; `RunAgentEvaluationController.SealedManifestGuard.cs` — `MapRunAgentEvaluationSealedManifestConflict` |
| 1024 | Architecture package DOCX download `blockedReason` | `architecture-package-docx-mutation-blocked-reason.ts`, `downloads-blob-trigger-architecture-package-docx.ts` — `downloadArchitecturePackageDocx` |
| 1025 | Run package export download `blockedReason` | `run-package-export-mutation-blocked-reason.ts`, `downloads-blob-trigger-run-package.ts` — `downloadRunPackageExport` |
| 1026 | Decision receipt JSON download `blockedReason` | `decision-receipt-mutation-blocked-reason.ts`, `downloads-blob-trigger-decision-receipt.ts` — `downloadRunDecisionReceiptJson` |
| 1027 | Architecture request JSON download `blockedReason` | `architecture-request-json-mutation-blocked-reason.ts`, `downloads-blob-trigger-architecture-request.ts` — `downloadArchitectureRequestJson` |
| 1028 | End-to-end compare export download `blockedReason` | `comparison-docx-mutation-blocked-reason.ts`, `downloads-blob-trigger-end-to-end-compare-export.ts` — `downloadEndToEndCompareExport` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave86ArchitectureTests.cs`.

**Hasher baseline note:** wave 86 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** none — see [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE87.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE87.md) (1029–1040) when opened.
