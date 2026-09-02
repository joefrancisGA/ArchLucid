> **Scope:** Contributor-reference — wave-5 robustness controls for architecture create and review (branch `robust`).

# Architecture create/review robustness — wave 5

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE4.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE4.md) (suggestions 31–40).

| # | Control | Primary wiring |
|---|---------|----------------|
| 41 | Cross-run loads prior Γ | `IGraphSnapshotRepository.GetByIdAsync`, analyzer overloads, cross-run engines |
| 42 | Pin pack versions | `PinnedPolicyPackRow`, `RunPolicyPackPinService`, `FindingAnalysisContextBuilder` |
| 43 | Effectful engines use pin | `EffectfulFindingEngineEvidenceLoader`, `TryGetDownloadByPackageIdAsync` |
| 44 | Commit re-verifies pins | `RunPolicyPackPinService.VerifyPinIntegrityOrThrowAsync`, draft hash verify in commit guard |
| 45 | `h(M)` binds `ArchitectureVersionId` | `ManifestDocument.ArchitectureVersionId`, `ManifestHashService` v2 projection |
| 46 | Replay execute via authority | `ReplayRunService.ExecutePrepared` authority branch when `AuthorityPipelineComplete` |
| 47 | UI shows lifecycle phase | `RunDetailPackageStatusStrip`, `resolveAuthorityLifecycleCommitBlock` |
| 48 | Split agent vs authority status | `IRunStateTransitionService.ShouldSkipLegacyRunStatusPatchAfterAuthorityProgress` |
| 49 | Synthesis generate pins + admittance | `ArchitectureSynthesisKernel.GenerateAsync` pack pin + admittance guard |
| 50 | Plugin skip set from DI | `RegisteredFindingEngineTypeRegistry`, `FindingEngineRegistrationDistinctnessHostedService` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave5ArchitectureTests.cs`.
