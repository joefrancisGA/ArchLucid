# Architecture create/review robustness — wave 2

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS.md`](ARCHITECTURE_REVIEW_ROBUSTNESS.md) (suggestions 1–10).

| # | Control | Primary wiring |
|---|---------|----------------|
| 11 | Fail-closed identity/version pin | `ArchitecturePinningFailedException`, `ArchitectureSynthesisKernel` ensure methods, `ArchitectureRunCreatePostCreateHooks`, commit guard |
| 12 | Artifact-addressed versions (κ not request-only) | `ArchitectureVersionContentFingerprint`, `IntakeRequestHashSha256`, migration **340** |
| 13 | Draft spawn pins revision | `DraftRequestResponse.SpawnedArchitectureVersionId`, `DraftAdmissionService` |
| 14 | Finding analysis context + pack coverage | `FindingAnalysisContext`, `FindingAnalysisContextBuilder`, `PolicyPackCategoryCoverageValidator` |
| 15 | Single decision authority (no Δ2 appendix enqueue) | `PostCommitProjectionEnqueuer` omits V2 materialization |
| 16 | Authority lifecycle phase (not agent-task enum) | `AuthorityRunLifecyclePhase`, `AuthorityRunLifecyclePhaseResolver` |
| 17 | One theory of finding (specialist → authority) | `ArchitectureIntelligenceAuthorityFindingsContributor` |
| 18 | Hash field inclusion matrix | [`MANIFEST_HASH_FIELD_INCLUSION.md`](MANIFEST_HASH_FIELD_INCLUSION.md) |
| 19 | Graph reuse = f(κ) | `GraphSnapshotCommittedReuseResolver.IsObservationallyEqual`, graph fingerprint stamp |
| 20 | Typed prior for cross-run engines | `PriorReviewSnapshots`, `FindingAnalysisContextBuilder` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave2ArchitectureTests.cs`.
