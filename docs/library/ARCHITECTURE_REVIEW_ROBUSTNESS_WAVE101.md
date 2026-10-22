> **Scope:** Contributor-reference — wave-101 robustness controls for architecture create and review (branch `cursor/wave101-robustness-e14f`).

# Architecture create/review robustness — wave 101

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE100.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE100.md) (1185–1196 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 1197 | Manifest compare base lifecycle-incomplete **409** mapper | `ComparisonController.cs` — `MapComparisonSealedManifestConflict` |
| 1198 | Manifest compare target lifecycle-incomplete **409** mapper | `ComparisonController.cs` — `MapComparisonSealedManifestConflict` |
| 1199 | Manifest compare artifact-inventory mismatch **409** mapper | `ComparisonController.cs` — `MapComparisonSealedManifestConflict` |
| 1200 | Compare explain pin-fingerprint mismatch **409** mapper | `ExplanationController.CompareHolistic.cs` — `MapExplanationSealedManifestConflict` |
| 1201 | Compare explain sealed-hash mismatch **409** mapper | `ExplanationController.CompareHolistic.cs` — `MapExplanationSealedManifestConflict` |
| 1202 | Compare explain base lifecycle-incomplete **409** mapper | `ExplanationController.CompareHolistic.cs` — `MapExplanationSealedManifestConflict` |
| 1203 | Compare explain target lifecycle-incomplete **409** mapper | `ExplanationController.CompareHolistic.cs` — `MapExplanationSealedManifestConflict` |
| 1204 | Governance manifest promotion POST `blockedReason` | `governance-workflow-mutation-blocked-reason.ts`, `governance-workflow-api-approvals.ts` — `promoteManifest` |
| 1205 | Draft intake branch POST `blockedReason` | `architecture-draft-blocked-reason.ts`, `draft-intake-api-lifecycle.ts` — `branchDraftRequest` |
| 1206 | Draft intake clone-snapshot POST `blockedReason` | `architecture-draft-blocked-reason.ts`, `draft-intake-api-lifecycle.ts` — `cloneDraftSnapshot` |
| 1207 | Risk exception revoke POST `blockedReason` | `risk-exception-mutation-blocked-reason.ts`, `governance-stickiness-api-exceptions-schedules.ts` — `revokeRiskException` |
| 1208 | Recurrence schedule create POST `blockedReason` | `recurrence-schedule-mutation-blocked-reason.ts`, `governance-stickiness-api-exceptions-schedules.ts` — `createArchitectureReviewRecurrenceSchedule` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave101ArchitectureTests.cs`.

**Hasher baseline note:** wave 101 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** none — see [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE102.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE102.md) (1209–1220).
