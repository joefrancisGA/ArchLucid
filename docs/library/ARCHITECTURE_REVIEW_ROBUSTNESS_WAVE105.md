> **Scope:** Contributor-reference — wave-105 robustness controls for architecture create and review (branch `cursor/wave105-robustness-e14f`).

# Architecture create/review robustness — wave 105

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE104.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE104.md) (1233–1244 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 1245 | Finding verification markdown export **409** mapper | `FindingVerificationController.Export.cs` — `MapFindingVerificationSealedManifestConflict` |
| 1246 | Finding verification DOCX export **409** mapper | `FindingVerificationController.Export.cs` — `MapFindingVerificationSealedManifestConflict` |
| 1247 | Finding verification async enqueue sealed-manifest guard + **409** mapper | `FindingVerificationController.cs`, `FindingVerificationController.SealedManifestGuard.cs` — `EnsureFindingVerificationRunSealedManifestAllowedAsync` |
| 1248 | Learning planning report GET runtime **409** mapper | `LearningController.PlanningReport.cs` — `MapLearningPlanningSealedManifestConflict` |
| 1249 | Learning planning report file GET runtime **409** mapper | `LearningController.PlanningReport.cs` — `MapLearningPlanningSealedManifestConflict` |
| 1250 | Product learning triage report GET runtime **409** mapper | `ProductLearningController.Triage.cs` — `MapProductLearningSealedManifestConflict` |
| 1251 | Product learning triage report file GET runtime **409** mapper | `ProductLearningController.Triage.cs` — `MapProductLearningSealedManifestConflict` |
| 1252 | Finding verification POST `blockedReason` | `finding-verification-mutation-blocked-reason.ts`, `finding-verification-api.ts` — `postFindingVerificationReport` |
| 1253 | Finding merge-conflict resolve POST `blockedReason` | `finding-merge-conflict-blocked-reason.ts`, `finding-merge-conflict-api.ts` — `resolveFindingMergeConflict` |
| 1254 | Conversation ask POST `blockedReason` | `ask-blocked-reason.ts`, `conversation-api.ts` — `askArchLucid` |
| 1255 | Comparison narrative via ask `blockedReason` | `ask-blocked-reason.ts`, `conversation-api.ts` — `fetchComparisonNarrativeViaAsk` (via `askArchLucid`) |
| 1256 | Architecture request draft POST `blockedReason` | `architecture-request-draft-mutation-blocked-reason.ts`, `architecture-request-draft-api.ts` — `draftArchitectureRequest` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave105ArchitectureTests.cs`.

**Hasher baseline note:** wave 105 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** none — see [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE106.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE106.md) (1257–1268) when opened.
