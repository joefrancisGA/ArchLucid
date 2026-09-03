> **Scope:** Contributor-reference — wave-11 robustness controls for architecture create and review (branch `robust`).

# Architecture create/review robustness — wave 11

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE10.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE10.md) (suggestions 91–100).

| # | Control | Primary wiring |
|---|---------|----------------|
| 101 | Re-verify cloned pins on replay prepare | `ReplayRunPrepareStage`, `IRunPolicyPackPinService` / `IRunEvidencePackagePinService` |
| 102 | Evidence-package pin integrity at Φ | `FindingAnalysisContextBuilder` |
| 103 | Freshness from pinned `CollectionUtc` only | `EffectfulFindingEngineCollectionFreshness`, effectful finding engines |
| 104 | Golden-cohort Hasher B pin-aware overload | `GoldenCohortContentBaselineGeneratorTests`, `GoldenManifestFingerprint.ComputeContentSha256Hex(..., createTimePins)` |
| 105 | Run API exposes κ/KM content-hash pins | `RunRecord` on `RunDetailDto` / OpenAPI `RunRecord` schema |
| 106 | Focused-pilot pins in reuse, prior, hashers | `AuthorityPipelineGraphStage`, `GraphSnapshotCommittedReuseResolver`, `ManifestHashService` v6 |
| 107 | Fail-closed KM content-hash at load | `ArchitectureKnowledgeModelAccess.GetForRunAsync` |
| 108 | Fail-closed pinned policy-pack row hydration | `FindingAnalysisContextBuilder.LoadPackContentsForPinnedRowsAsync` |
| 109 | Commit governance snapshot from pins | `RunHeaderPinnedPolicyPackAssignmentFactory`, `CommittedEffectiveGovernanceSnapshotCapturer` |
| 110 | Lifecycle `Complete` on findings list + First Value report | `RunFindingsQueryService.ListRunFindingsAsync`, `FirstValueReportBuilder` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave11ArchitectureTests.cs`.

**Hasher baseline note:** suggestion 106 bumps production `h(M)` to **`v6`** (focused-pilot pin binding). Owner re-lock via `tests/manifest-hash/hasher-baseline-v6.json` and golden-cohort lock when pin-bound cohort fixtures land.
