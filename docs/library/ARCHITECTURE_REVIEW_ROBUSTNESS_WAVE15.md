> **Scope:** Contributor-reference — wave-15 robustness controls for architecture create and review (branch `robust`).

# Architecture create/review robustness — wave 15

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE14.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE14.md) (suggestions 131–140).

| # | Control | Primary wiring |
|---|---------|----------------|
| 141 | Hasher B callers pass inventory rows | `CommittedArtifactInventoryFingerprintProjector` (Application), golden cohort / CLI fingerprint callers |
| 142 | Artifact-bundle inventory hashes blob bytes | `ManifestCommittedArtifactInventoryBundleMaterialSerializer`, `ManifestCommittedArtifactInventoryMaterialFactory` |
| 143 | Recovery recomputes inventory hashes | `ManifestCommittedArtifactInventoryCapturer.EnsureStoredInventoryContentHashesMatchOrThrow`, `AuthorityCommitRecoveryVerifier` |
| 144 | Typed `EvidencePackageId` on `Finding` | `Finding.EvidencePackageId`, `FindingPropertyKeys.EvidencePackageId`, resolver |
| 145 | OpenAPI object for `CompareInputFingerprints` + inventory | `PublicHttpContractSchemasOpenApiDocumentTransformer`, `CompareInputFingerprints` |
| 146 | Lifecycle transition on create | `BaselineMutationAuditArchitectureDurableWriter` (`run-created`) |
| 147 | Async execute scope assert | `ArchitectureRunAsyncOperationHostedService`, `ReplayRunScopeAssertionGuard` |
| 148 | Replay clone fail-closed without source header | `ReplayRunCloneStage`, `ReplayRunExecutePreparedStage` |
| 149 | Skip-persist finalize still seals inventory | `ManifestFinalizationService.Artifacts.cs` |
| 150 | Decision receipt canonical hash / Hasher A v10 | `DecisionReceiptCanonicalHasher`, `ManifestDecisionReceiptHashCapturer`, `ManifestHashService` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave15ArchitectureTests.cs`.

**Successor:** [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE16.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE16.md) (suggestions 151–160; Hasher A **`v11`** for all-run receipt binding, skip-persist governance/review snapshots, persisted findings blob inventory bytes).
