> **Scope:** Contributor-reference — wave-6 robustness controls for architecture create and review (branch `robust`).

# Architecture create/review robustness — wave 6

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE5.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE5.md) (suggestions 41–50).

| # | Control | Primary wiring |
|---|---------|----------------|
| 51 | Persist evidence package pin at create | `RunEvidencePackagePinService`, migration **343**, `RunCreatePinOrchestrator` |
| 52 | Commit fail-closed on missing pack pin hash | `RunPolicyPackPinService.VerifyPinIntegrityOrThrowAsync` |
| 53 | Restore focused-pilot from run header | `RunGovernanceScopePinService`, `AuthorityPipelineStagesExecutor` |
| 54 | Cross-run fail-closed on missing prior Γ | `CrossRunDiffFindingPriorGuard.EnsurePriorGraphLoadedOrThrow` |
| 55 | Multi-cloud evidence pins | `PinnedEvidencePackageRow`, `FindingAnalysisContext.EvidencePins`, `EffectfulFindingEngineEvidenceLoader` |
| 56 | Re-verify κ at commit | `ArchitectureVersionContentFingerprintVerifier`, `CommitOutputIntegrityService` |
| 57 | `h(M)` binds create-time pins (v3) | `ManifestDocument.CreateTime*Pins`, `ManifestHashService` v3, `AuthorityCommitCreateTimePinBinder` |
| 58 | Lifecycle phase on list/compare/export | `RunSummary.AuthorityLifecyclePhase`, `AuthorityLifecycleCompareExportGuard` |
| 59 | Replay authority-only when stage outcomes exist | `ReplayRunService` + `IRunStageOutcomesRepository` |
| 60 | Drop legacy `string[]` pack pin JSON | `RunHeaderPinDeserializer`, `FindingAnalysisContextBuilder` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave6ArchitectureTests.cs`.
