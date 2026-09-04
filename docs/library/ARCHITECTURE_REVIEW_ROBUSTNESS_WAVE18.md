> **Scope:** Contributor-reference — wave-18 robustness controls for architecture create and review (branch `robust`).

# Architecture create/review robustness — wave 18

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE17.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE17.md) (suggestions 161–170).

| # | Control | Primary wiring |
|---|---------|----------------|
| 171 | Export receipt matches sealed hash | `ManifestDecisionReceiptExportBinder`, `DecisionReceiptService` |
| 172 | Fail-closed when verdict missing on export | `DecisionReceiptService.BuildForRunAsync` |
| 173 | Skip-persist must persist decision trace | `ManifestFinalizationService.Artifacts.cs` |
| 174 | Review-standards snapshot fail-closed | `ManifestFinalizationService.Artifacts.cs` |
| 175 | Compare fail-closed on empty inventory | `RunComparePinFingerprintGuard` |
| 176 | Version-string compare uses same outcomes as run-id compare | `CompareRunsApplicationFacade`, `ManifestsController.Compare.cs` |
| 177 | Distinct HTTP problem type for inventory mismatch | `ProblemTypes`, `ComparisonController` |
| 178 | Recovery verifies sealed receipt hash | `AuthorityCommitRecoveryVerifier`, commit orchestrator |
| 179 | In-memory finding properties stay synced | `FindingJsonConverter` |
| 180 | Scope-assert messages match operation kind | `RunScopeAssertionGuard`, async hosted service |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave18ArchitectureTests.cs`.

**Hasher baseline note:** wave 18 does not bump Hasher A schema version; receipt verification and review fail-closed are export/recovery/finalization gates on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`). See [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE19.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE19.md) for suggestions 181–190.
