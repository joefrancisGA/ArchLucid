> **Scope:** Contributor-reference — wave-19 robustness controls for architecture create and review (branch `robust`).

# Architecture create/review robustness — wave 19

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE18.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE18.md) (suggestions 171–180).

| # | Control | Primary wiring |
|---|---------|----------------|
| 181 | Export receipt mismatch fail-closed (distinct problem type) | `ManifestDecisionReceiptExportBinder`, `DecisionReceiptService`, `ArtifactExportController.Export.Download.cs`, `ProblemTypes` |
| 182 | Export binds verdict/version from sealed document | `DecisionReceiptService`, `ManifestDecisionReceiptExportBinder` |
| 183 | ZIP export verifies sealed receipt hash | `RunExportAuthorityMaterialLoader`, export binder |
| 184 | Version-string compare emits `InputFingerprints` | `CompareRunsApplicationFacade`, `ManifestDiffResult`, `ManifestsController.Compare.cs` |
| 185 | Version-string compare diffs inventory-checked document | `CompareRunsApplicationFacade`, `IAuthorityCommitProjectionBuilder` |
| 186 | Pin fingerprints fail-closed when empty | `RunComparePinFingerprintGuard` |
| 187 | Agent-result compare enforces pin/inventory fingerprints | `CompareRunsApplicationFacade.LoadScopedRunPairAsync`, `RunComparisonController.Agents.cs` |
| 188 | Recovery verifies `ManifestHash` without mutating receipt field | `AuthorityCommitRecoveryVerifier`, `ManifestDocumentHashScratch` |
| 189 | Commit/finalize assert caller scope | `RunScopeAssertionGuard`, commit orchestrator, finalization |
| 190 | Finding `EnforcementTier` + read-path property sync | `FindingJsonConverter` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave19ArchitectureTests.cs`.

**Hasher baseline note:** wave 19 does not bump Hasher A schema version; receipt verification, compare fingerprints, and finding read-path sync are gates on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

Next: [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE20.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE20.md) (suggestions 191–200).
