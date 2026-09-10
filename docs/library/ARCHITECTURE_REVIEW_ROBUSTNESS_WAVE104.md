> **Scope:** Contributor-reference — wave-104 robustness controls for architecture create and review (branch `cursor/wave104-robustness-e14f`).

# Architecture create/review robustness — wave 104

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE103.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE103.md) (1221–1232 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 1233 | Workspace prior-compare left lifecycle-incomplete blocked reason mapper | `RunDetailPageBundleController.WorkspaceContext.cs` — `MapRunDetailPageBundlePriorCompareSealedManifestBlockedReason` |
| 1234 | Workspace prior-compare right lifecycle-incomplete blocked reason mapper | `RunDetailPageBundleController.WorkspaceContext.cs` — `MapRunDetailPageBundlePriorCompareSealedManifestBlockedReason` |
| 1235 | Recommendation learning rebuild **409** mapper | `RecommendationLearningController.Mutate.cs` — `MapRecommendationLearningSealedManifestConflict` |
| 1236 | Recommendation learning rollback **409** mapper | `RecommendationLearningController.Mutate.cs` — `MapRecommendationLearningSealedManifestConflict` |
| 1237 | Recommendation learning preview **409** mapper | `RecommendationLearningController.Ops.cs` — `MapRecommendationLearningSealedManifestConflict` |
| 1238 | Operator saved view create **409** mapper | `OperatorSavedViewsController.cs` — `MapOperatorSavedViewsSealedManifestConflict` |
| 1239 | Finding insight signal POST sealed-manifest guard + **409** mapper | `FindingInsightSignalController.cs`, `FindingInsightSignalController.SealedManifestGuard.cs` — `MapFindingInsightSignalSealedManifestConflict` |
| 1240 | Holistic critic POST `blockedReason` | `holistic-critic-blocked-reason.ts`, `holistic-critic-api.ts` — `generateHolisticCritique` |
| 1241 | Finding ask POST `blockedReason` | `finding-ask-blocked-reason.ts`, `finding-ask-api.ts` — `askAboutFinding` |
| 1242 | Finding insight signal POST `blockedReason` | `finding-insight-signal-mutation-blocked-reason.ts`, `finding-insight-signal-api.ts` — `postFindingInsightSignal` |
| 1243 | Recommendation learning preview/rollback/rebuild `blockedReason` | `recommendation-learning-mutation-blocked-reason.ts`, `recommendation-learning-operational-api.ts`, `recommendation-replay-api.ts` |
| 1244 | Operator saved view create `blockedReason` | `operator-saved-view-mutation-blocked-reason.ts`, `operator-saved-views.ts` — `createOperatorSavedView` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave104ArchitectureTests.cs`.

**Hasher baseline note:** wave 104 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** none — see [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE105.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE105.md) (1245–1256) when opened.
