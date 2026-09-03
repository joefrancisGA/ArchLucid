> **Scope:** Contributor-reference — wave-14 robustness controls for architecture create and review (branch `robust`).

# Architecture create/review robustness — wave 14

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE13.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE13.md) (suggestions 121–130).

| # | Control | Primary wiring |
|---|---------|----------------|
| 131 | Fail-closed decision receipt when hash/version missing | `DecisionReceiptComposer`, `DecisionReceiptService` |
| 132 | Resolve evidence refs against pinned package IDs | `FindingPinnedEvidencePackageReferenceResolver`, `FindingEvidenceReferentialIntegrityValidator` |
| 133 | Inventory hashes artifact blob bytes | `ManifestCommittedArtifactInventoryMaterialFactory`, `ManifestCommittedArtifactInventoryCapturer` |
| 134 | Hasher B binds committed artifact inventory | `GoldenManifestFingerprint.ComputeContentSha256Hex` inventory overload |
| 135 | OpenAPI for receipt hash, compare fingerprints | `PublicHttpContractSchemasOpenApiDocumentTransformer` |
| 136 | Lifecycle transition audit on execute start + quality-gate reject | `BaselineMutationAuditArchitectureDurableWriter` |
| 137 | Replay factory fail-closed without source header | `ReplayAuthorityRunRecordFactory`, `ReplayRunPrepareStage` |
| 138 | Incomplete-pipeline execute asserts caller scope | `IncompleteAuthorityPipelineExecuteHandler`, `ReplayRunScopeAssertionGuard` |
| 139 | Recovery verifier checks inventory vs persisted pointers | `AuthorityCommitRecoveryVerifier`, `ManifestCommittedArtifactInventoryCapturer` |
| 140 | Version-string manifest compare requires pin fingerprint match | `ManifestsController.Compare.cs`, `RunComparePinFingerprintGuard` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave14ArchitectureTests.cs`.

**Hasher baseline note:** suggestion 133 bumps production `h(M)` to **`v9`** (committed artifact inventory binds blob bytes, not content ids). Owner re-lock via `tests/manifest-hash/hasher-baseline-v9.json`.
