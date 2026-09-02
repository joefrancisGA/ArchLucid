> **Scope:** Contributor-reference — wave-3 robustness controls for architecture creation and review (branch `robust`).

# Architecture create/review robustness — wave 3

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE2.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE2.md) (suggestions 11–20).

| # | Control | Primary wiring |
|---|---------|----------------|
| 21 | Engines accept typed analysis context | `IFindingEngine` / `IEffectfulFindingEngine`, `EngineAdapter`, `FindingsOrchestrator` |
| 22 | Plugin EngineType distinctness at startup | `FindingEngineRegistrationDistinctnessValidator`, `FindingEngineRegistrationDistinctnessHostedService`, `FindingEnginePluginDiscovery` |
| 23 | Graph reuse fail-closed on missing fingerprints | `GraphSnapshotCommittedReuseResolver`, `AuthorityPipelineGraphStage` |
| 24 | Authority lifecycle phase on run detail + commit gate | `ArchitectureRunDetail.AuthorityLifecyclePhase`, `CommitOutputIntegrityService` |
| 25 | Draft document content hash pin at spawn | `DraftDocumentContentFingerprint`, migration **341**, `DraftAdmissionService` |
| 26 | Pack required-category entailment | `PolicyPackRequiredFindingCategoryResolver`, `FindingAnalysisContext.RequiredFindingCategories` |
| 27 | Specialist → finding ADR 0063 embedding | `SpecialistFindingAuthorityEmbedding`, `ArchitectureIntelligenceAuthorityFindingsContributor` |
| 28 | No four-agent loop on create-architecture | `ArchitectureSynthesisKernel` (single synthesis path) |
| 29 | Orchestrator merge uses ADR 0063 keys only | `FindingsOrchestrator` + `FindingSnapshotConfluentMerger` |
| 30 | Block commit on Mixed/Fallback execution mode | `StructuralExecutionModeCommitGuard`, `CommitOutputIntegrityService` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave3ArchitectureTests.cs`.
