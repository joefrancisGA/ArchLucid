> **Scope:** Contributor-reference — wave-7 robustness controls for architecture create and review (branch `robust`).

# Architecture create/review robustness — wave 7

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE6.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE6.md) (suggestions 51–60).

| # | Control | Primary wiring |
|---|---------|----------------|
| 61 | Re-verify evidence pin hash at commit | `RunEvidencePackagePinService.VerifyPinIntegrityOrThrowAsync`, `CommitOutputIntegrityService` |
| 62 | Clone create-time pins on replay headers | `ReplayAuthorityRunRecordFactory` |
| 63 | κ commit verify with knowledge model | `CommitOutputIntegrityService` + `IArchitectureKnowledgeModelAccess` |
| 64 | Lifecycle Complete guard on export surfaces | `AuthorityLifecycleCompareExportGuard`, CSV/DOCX/one-pager services |
| 65 | List/compare UI uses `AuthorityLifecyclePhase` | `reviews-hub-package-display`, `compare-baseline-run`, OpenAPI list DTOs |
| 66 | Fail-closed corrupt evidence pin JSON | `RunEvidencePackagePinService.ResolvePinsFromHeader`, `AuthorityCommitCreateTimePinBinder` |
| 67 | No latest-in-scope when pin hash committed | `FindingAnalysisContext.HasCreateTimeEvidencePinCommitment`, `EffectfulFindingEngineEvidenceLoader` |
| 68 | Restore focused-pilot on agent loop | `AgentLoopPrepareStage` + `IRunGovernanceScopePinService` |
| 69 | Evidence pin hash digest in `h(M)` (v4) | `ManifestDocument.CreateTimeEvidencePackagePinsHashSha256`, `ManifestHashService` v4 |
| 70 | Unified list Failed phase + shared resolver | `ArchLucid.Core.Runs.AuthorityRunLifecyclePhaseListResolver`, `AuthorityRunMapper` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave7ArchitectureTests.cs`.
