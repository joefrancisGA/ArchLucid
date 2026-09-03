> **Scope:** Contributor-reference — wave-13 robustness controls for architecture create and review (branch `robust`).

# Architecture create/review robustness — wave 13

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE12.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE12.md) (suggestions 111–120).

| # | Control | Primary wiring |
|---|---------|----------------|
| 121 | Manifest retrieval requires lifecycle `Complete` | `ManifestsController.Get.cs` |
| 122 | Pin policy-pack enforcement at run create | `PinnedPolicyPackRow`, `RunPolicyPackPinService`, `RunHeaderPinnedPolicyPackAssignmentFactory` |
| 123 | Bind decision receipt to manifest hash | `DecisionReceiptDocument`, `DecisionReceiptComposer`, `DecisionReceiptService` |
| 124 | Immutable artifact inventory on manifest | `CommittedArtifactInventoryEntry`, `ManifestCommittedArtifactInventoryCapturer`, `ManifestDocument` |
| 125 | Evidence-to-finding referential integrity at commit | `FindingEvidenceReferentialIntegrityValidator`, `CommitOutputIntegrityService` |
| 126 | Pin compare input fingerprints in output | `CompareInputFingerprints`, `ComparisonResult`, `CompareRunsApplicationFacade`, `RunComparePinFingerprintGuard` |
| 127 | Tenant/scope assertions on replay | `ReplayRunScopeAssertionGuard`, replay prepare/commit/execute stages |
| 128 | Append-only lifecycle transition audit | `AuthorityRunLifecycleTransitionAuditor`, `AuditEventTypes.Run.LifecycleTransition`, commit/failure hooks |
| 129 | Deterministic hashed timestamps (hasher **v8**) | `ManifestHashService` v8, exclude `GeneratedUtc` from hash; bind `CommittedArtifactInventory` |
| 130 | Recovery verifier for partial commits | `AuthorityCommitRecoveryVerifier`, `AuthorityDrivenArchitectureRunCommitOrchestrator` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave13ArchitectureTests.cs`.

**Hasher baseline note:** suggestion 129 bumps production `h(M)` to **`v8`** (committed artifact inventory binding; review snapshot excludes non-deterministic `GeneratedUtc`). Owner re-lock via `tests/manifest-hash/hasher-baseline-v8.json`.

**Successor:** [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE14.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE14.md) (suggestions 131–140; Hasher A **`v9`** for blob-bound inventory).
