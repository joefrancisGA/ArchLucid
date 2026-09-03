> **Scope:** Contributor-reference — wave-16 robustness controls for architecture create and review (branch `robust`).

# Architecture create/review robustness — wave 16

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE15.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE15.md) (suggestions 141–150).

| # | Control | Primary wiring |
|---|---------|----------------|
| 151 | Recovery passes recomputed inventory material | `ManifestCommittedArtifactInventoryRecoveryMaterialBuilder`, `AuthorityDrivenArchitectureRunCommitOrchestrator` |
| 152 | Persist typed `EvidencePackageId` through finding JSON | `FindingJsonConverter` read/write |
| 153 | Hasher B must not default inventory to `null` | `GoldenManifestFingerprint` empty-inventory sentinel |
| 154 | Bind receipt hash for every committed run | `ManifestDecisionReceiptHashCapturer` |
| 155 | Async replay asserts caller scope | `ArchitectureRunAsyncOperationHostedService` replay branch |
| 156 | Compare fail-closed on inventory hash mismatch | `RunComparePinFingerprintGuard`, `CompareRunsApplicationFacade` |
| 157 | Replay clone preserves source evidence package identity | `ReplayRunCloneStage` |
| 158 | Skip-persist still captures governance/review snapshots | `ManifestFinalizationService.Artifacts.cs` |
| 159 | Findings-snapshot inventory hashes stored blob bytes | `ManifestCommittedArtifactInventoryMaterialFactory`, `FindingsSerialization.SerializeSnapshot` |
| 160 | Re-lock public HTTP contracts for wave-15 fields | `openapi-v1.contract.snapshot.json` via `OpenApiContractSnapshotTests` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave16ArchitectureTests.cs`.

**Hasher baseline note:** suggestions 154, 158, and 159 bump production `h(M)` to **`v11`** (all-run receipt binding, skip-persist governance/review snapshots, persisted findings blob inventory bytes). Owner re-lock via `tests/manifest-hash/hasher-baseline-v11.json`.
