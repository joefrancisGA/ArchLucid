> **Scope:** Contributor-reference — wave-100 robustness controls for architecture create and review (branch `cursor/wave100-robustness-e14f`).

# Architecture create/review robustness — wave 100

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE99.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE99.md) (1173–1184 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 1185 | Run comparison artifact-inventory mismatch **409** mapper | `RunComparisonController.Agents.cs` — `MapRunComparisonSealedManifestConflict` |
| 1186 | Run comparison left lifecycle-incomplete **409** mapper | `RunComparisonController.Agents.cs` — `MapRunComparisonSealedManifestConflict` |
| 1187 | Run comparison right lifecycle-incomplete **409** mapper | `RunComparisonController.Agents.cs` — `MapRunComparisonSealedManifestConflict` |
| 1188 | Advisory draft async in-progress **409** mapper | `RunsController.Intake.DraftAsync.cs` — `MapRunsSealedManifestConflict` |
| 1189 | Advisory draft async canceled **409** mapper | `RunsController.Intake.DraftAsync.cs` — `MapRunsSealedManifestConflict` |
| 1190 | Manifest compare pin-fingerprint mismatch **409** mapper | `ComparisonController.cs` — `MapComparisonSealedManifestConflict` |
| 1191 | Manifest compare sealed-hash mismatch **409** mapper | `ComparisonController.cs` — `MapComparisonSealedManifestConflict` |
| 1192 | Draft intake reopen POST `blockedReason` | `architecture-draft-blocked-reason.ts`, `draft-intake-api-lifecycle.ts` — `reopenDraftRequest` |
| 1193 | Draft intake abandon POST `blockedReason` | `architecture-draft-blocked-reason.ts`, `draft-intake-api-lifecycle.ts` — `abandonDraftRequest` |
| 1194 | Architecture request delete DELETE `blockedReason` | `architecture-request-lifecycle-mutation-blocked-reason.ts`, `architecture-runs-lifecycle.ts` — `deleteArchitectureRequest` |
| 1195 | Governance approval batch-review POST `blockedReason` | `governance-workflow-mutation-blocked-reason.ts`, `governance-workflow-api-approvals.ts` — `batchReviewGovernanceApprovalRequests` |
| 1196 | Governance approval submit POST `blockedReason` | `governance-workflow-mutation-blocked-reason.ts`, `governance-workflow-api-approvals.ts` — `submitApprovalRequest` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave100ArchitectureTests.cs`.

**Hasher baseline note:** wave 100 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** none — see [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE101.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE101.md) (1197–1208) when opened.
