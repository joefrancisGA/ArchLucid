> **Scope:** Contributor-reference — wave-9 robustness controls for architecture create and review (branch `robust`).

# Architecture create/review robustness — wave 9

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE7.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE7.md) (suggestions 61–70).

| # | Control | Primary wiring |
|---|---------|----------------|
| 81 | Unify list/detail `AuthorityLifecyclePhase` | `AuthorityRunLifecyclePhaseListResolver` (Complete requires commit + golden manifest) |
| 82 | Retire dead `EvidencePackagePinResolver` | `RunEvidencePackagePinService` only; DI registration removed |
| 83 | Lifecycle Complete guard on sponsor exports | `AuthorityLifecycleCompareExportGuard` on sponsor packet + buyer proof (board pack is scope-wide — N/A) |
| 84 | Pin `CollectionUtc` for AWS/GCP at create | `RunEvidencePackagePinService.BuildPinnedRowsAsync` |
| 85 | ROI freshness from pinned evidence JSON | `RoiCostEvidenceCollectionResolver` prefers header pin `CollectionUtc` |
| 86 | Hasher B binds create-time pin rows | `GoldenManifestFingerprint.ComputeContentSha256Hex(manifest, createTimePins)`, `RunHeaderCreateTimePinCommitmentFactory` |
| 87 | Create-time κ header pin | Migration `344`, `ArchitectureVersionService.PinRunVersionAsync`, findings + commit verify |
| 88 | Policy-pack JSON-byte integrity verify | `RunPolicyPackPinService.VerifyPinIntegrityOrThrowAsync` |
| 89 | Normalize empty vs missing pin JSON | `RunEvidencePackagePinService` always writes JSON+hash; deserializer accepts `[]` |
| 90 | Focused-pilot restore on replay/async paths | `ReplayRunExecutePreparedStage`, `IncompleteAuthorityPipelineExecuteHandler` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave9ArchitectureTests.cs`.

**Hasher B note:** suggestion 86 changes cohort content fingerprints when create-time pins are present. Owner re-lock via `golden-cohort lock-baseline --write` is required before nightly drift compares green against new projection.

Wave 10 suggestions (91–100): [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE10.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE10.md).
