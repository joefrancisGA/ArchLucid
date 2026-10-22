> **Scope:** Contributor-reference — wave-17 robustness controls for architecture create and review (branch `robust`).

# Architecture create/review robustness — wave 17

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE16.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE16.md) (suggestions 151–160). Successor: [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE18.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE18.md) (171–180).

| # | Control | Primary wiring |
|---|---------|----------------|
| 161 | Seal receipt hash after governance/review snapshots | `ManifestFinalizationService.Artifacts.cs`, `ManifestDecisionReceiptHashCapturer` |
| 162 | Fail-closed when feasibility verdict missing | `ManifestDecisionReceiptHashCapturer` |
| 163 | Export receipts for every sealed committed run | `DecisionReceiptService.BuildForRunAsync` |
| 164 | Version-string compare enforces inventory fingerprints | `ManifestsController.Compare.cs`, `IAuthorityQueryService` |
| 165 | Compare fail-closed when run headers missing | `CompareRunsApplicationFacade` |
| 166 | Distinct outcome for inventory mismatch | `ManifestCompareLoadOutcome`, `ComparisonController` |
| 167 | Skip-persist must persist sealed manifest body | `ManifestFinalizationService.Artifacts.cs` |
| 168 | Recovery/finalize hash same decision-trace bytes | `ManifestCommittedArtifactInventoryRecoveryMaterialBuilder`, `DecisionTraceRecordMapper` |
| 169 | `EvidencePackageId` synced with properties bag | `FindingJsonConverter` |
| 170 | Async create asserts caller scope | `ArchitectureRunAsyncOperationHostedService` create branch |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave17ArchitectureTests.cs`.

**Hasher baseline note:** suggestions 161, 162, and 167 bump production `h(M)` to **`v12`** (receipt sealed after governance/review snapshots, fail-closed verdict binding, skip-persist manifest body save). Owner re-lock via `tests/manifest-hash/hasher-baseline-v12.json`.
