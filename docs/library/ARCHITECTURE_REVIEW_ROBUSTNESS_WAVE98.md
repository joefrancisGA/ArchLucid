> **Scope:** Contributor-reference — wave-98 robustness controls for architecture create and review (branch `cursor/wave98-robustness-e14f`).

# Architecture create/review robustness — wave 98

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE97.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE97.md) (1149–1160 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 1161 | Manifest summary missing golden manifest **409** mapper | `AuthorityQueryController.SealedManifestGuard.cs` — `MapRunQuerySealedManifestConflict` |
| 1162 | Governance approval approve concurrent-finalize **409** mapper | `GovernanceController.ApprovalRequests.Review.cs` — `MapGovernanceSealedManifestConflict` |
| 1163 | Governance approval reject concurrent-finalize **409** mapper | `GovernanceController.ApprovalRequests.Review.cs` — `MapGovernanceSealedManifestConflict` |
| 1164 | Audit export row-cap exceeded **409** mapper | `AuditController.Export.Guard.cs` — `MapAuditExportSealedManifestConflict` |
| 1165 | Run export history lineage-unverified **409** mapper | `ExportsController.cs` — `MapExportReplaySealedManifestConflict` |
| 1166 | Export record load lineage-unverified **409** mapper | `ExportsController.cs` — `MapExportReplaySealedManifestConflict` |
| 1167 | Run archive sealed-review blocked **409** mapper | `RunsController.Archive.cs` — `MapRunsSealedManifestConflict` |
| 1168 | Governance approval approve POST `blockedReason` | `governance-workflow-mutation-blocked-reason.ts`, `governance-workflow-api-approvals.ts` — `approveRequest` |
| 1169 | Governance approval reject POST `blockedReason` | `governance-workflow-mutation-blocked-reason.ts`, `governance-workflow-api-approvals.ts` — `rejectRequest` |
| 1170 | Draft intake submit POST `blockedReason` | `architecture-draft-blocked-reason.ts`, `draft-intake-api-lifecycle.ts` — `submitDraftRequest` |
| 1171 | Finding disposition POST `blockedReason` | `finding-disposition-mutation-blocked-reason.ts`, `governance-stickiness-api-dispositions.ts` — `recordFindingDisposition` |
| 1172 | Bulk finding disposition POST `blockedReason` | `finding-bulk-disposition-blocked-reason.ts`, `governance-stickiness-api-dispositions.ts` — `recordBulkFindingDisposition` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave98ArchitectureTests.cs`.

**Hasher baseline note:** wave 98 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** none — see [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE99.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE99.md) (1173–1184).
