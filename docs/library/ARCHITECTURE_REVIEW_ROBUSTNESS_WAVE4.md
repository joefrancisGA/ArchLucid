> **Scope:** Contributor-reference — wave-4 robustness controls for architecture create and review (branch `robust`).

# Architecture create/review robustness — wave 4

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE3.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE3.md) (suggestions 21–30).

| # | Control | Primary wiring |
|---|---------|----------------|
| 31 | Cross-run engines require typed `Prior` | `CrossRunDiffFindingPriorGuard`, cross-run finding engines |
| 32 | Evidence package pin on analysis context | `EvidencePackagePin`, `EvidencePackagePinResolver`, `FindingAnalysisContext.EvidencePin` |
| 33 | Pack entailment via `requiredEngineTypes` | `PolicyPackContentDocument.RequiredEngineTypes`, `PolicyPackRequiredEngineTypeResolver`, `FindingsOrchestrator` |
| 34 | Pin theory-in-force at run create | migration **342**, `RunPolicyPackPinService`, run header patch on create |
| 35 | Prior from version lattice | `FindingAnalysisContextBuilder.TryResolvePriorAsync`, architecture-version + committed-run lookups |
| 36 | Replay uses authority path when pipeline complete | `ReplayRunService.PrepareReplayRunAsync` skips agent-task requirement |
| 37 | Stable LLM recommendation ids | `ArchitectureRecommendationStableId.FromLlmRecommendation`, LLM response mapper |
| 38 | `AuthorityLifecyclePhase` on OpenAPI run detail | `RunDetailsResponse.AuthorityLifecyclePhase`, `RunGraphQueryService` |
| 39 | Block create on Mixed/Fallback structural mode | `StructuralExecutionModeAdmittanceGuard`, `ArchitectureRunAuthorityCoordination` |
| 40 | Evidence graph materializer before Φ | `EvidenceGraphMaterializer`, `AuthorityPipelineFindingsStage` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave4ArchitectureTests.cs`.
