> **Scope:** Contributor-reference — wave-10 robustness controls for architecture create and review (branch `robust`).

# Architecture create/review robustness — wave 10

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE9.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE9.md) (suggestions 81–90).

| # | Control | Primary wiring |
|---|---------|----------------|
| 91 | Fail-closed missing κ header pin | `FindingAnalysisContextBuilder`, `CommitOutputIntegrityService` |
| 92 | Bind κ content hash into Hasher A (v5) | `AuthorityCommitCreateTimePinBinder`, `ManifestHashService` v5 |
| 93 | Graph reuse includes pin fingerprints | `GraphSnapshotCommittedReuseResolver`, `AuthorityPipelineGraphStage` |
| 94 | Retire live latest-in-scope fallbacks | `EffectfulFindingEngineEvidenceLoader`, `FindingAnalysisContextBuilder.ResolvePinnedPolicyPacksAsync` |
| 95 | Pin knowledge-model content hash at create | Migration **345**, `RunHeaderKnowledgeModelContentPin`, findings + commit verify |
| 96 | Cross-run prior must match prior run pins | `PriorReviewSnapshots`, `CrossRunDiffFindingPriorGuard.EnsurePriorGraphPinFingerprintsMatchOrThrow` |
| 97 | One projection for Hasher A and Hasher B | `ManifestCreateTimePinCanonicalProjection`, `GoldenManifestFingerprint` |
| 98 | Compare records duplicate keys | `ComparisonService`, `ComparisonResult.DuplicateKeyConflicts` |
| 99 | Board export uses lifecycle Complete | `ArchitectureReviewExportService` + `AuthorityLifecycleCompareExportGuard` |
| 100 | Re-verify policy-pack JSON-byte integrity at Φ | `FindingAnalysisContextBuilder` calls `RunPolicyPackPinService.VerifyPinIntegrityOrThrowAsync` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave10ArchitectureTests.cs`.

**Hasher baseline note:** suggestions 92 and 97 bump production `h(M)` to **`v5`** and align Hasher B pin projection. Owner re-lock via `golden-cohort lock-baseline --write` is required before nightly drift compares green against the new projection.
