> **Scope:** Contributor-reference — wave-102 robustness controls for architecture create and review (branch `cursor/wave102-robustness-e14f`).

# Architecture create/review robustness — wave 102

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE101.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE101.md) (1197–1208 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 1209 | Compare explain artifact-inventory mismatch **409** mapper | `ExplanationController.CompareHolistic.cs` — `MapExplanationSealedManifestConflict` |
| 1210 | Policy pack assignment enabled **409** mapper | `PolicyPacksController.Assignment.cs` — `MapPolicyPackSealedManifestConflict` |
| 1211 | Policy pack assignment organization-required **409** mapper | `PolicyPacksController.Assignment.cs` — `MapPolicyPackSealedManifestConflict` |
| 1212 | Demo viewer compare pin-fingerprint mismatch **409** mapper | `DemoViewerController.Compare.cs` — `MapDemoViewerSealedManifestConflict` |
| 1213 | Demo viewer compare artifact-inventory mismatch **409** mapper | `DemoViewerController.Compare.cs` — `MapDemoViewerSealedManifestConflict` |
| 1214 | Demo viewer compare sealed-hash mismatch **409** mapper | `DemoViewerController.Compare.cs` — `MapDemoViewerSealedManifestConflict` |
| 1215 | Demo viewer compare lifecycle-incomplete **409** mapper | `DemoViewerController.Compare.cs` — `MapDemoViewerSealedManifestConflict` |
| 1216 | Draft intake create POST `blockedReason` | `architecture-draft-blocked-reason.ts`, `draft-intake-api-crud.ts` — `createDraftRequest` |
| 1217 | Draft intake patch PUT `blockedReason` | `architecture-draft-blocked-reason.ts`, `draft-intake-api-crud.ts` — `patchDraftRequest` |
| 1218 | Draft intake answer POST `blockedReason` | `architecture-draft-blocked-reason.ts`, `draft-intake-api-questions.ts` — `answerDraftQuestion` |
| 1219 | Draft intake skip POST `blockedReason` | `architecture-draft-blocked-reason.ts`, `draft-intake-api-questions.ts` — `skipDraftQuestion` |
| 1220 | Draft intake reason POST and recurrence schedule update/preview `blockedReason` | `architecture-draft-blocked-reason.ts`, `draft-intake-api-lifecycle.ts` — `reasonDraftRequest`; `recurrence-schedule-mutation-blocked-reason.ts`, `governance-stickiness-api-exceptions-schedules.ts` — `updateArchitectureReviewRecurrenceSchedule`, `previewRecurrenceScheduleRuns` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave102ArchitectureTests.cs`.

**Hasher baseline note:** wave 102 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** none — see [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE103.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE103.md) (1221–1232).
