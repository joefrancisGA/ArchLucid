> **Scope:** Contributor-reference — wave-127 robustness controls for architecture create and review (branch `cursor/wave127-robustness-e14f`).

# Architecture create/review robustness — wave 127

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE126.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE126.md) (1497–1508 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 1509 | Architecture identity GET runtime **409** mapper | `ArchitecturesController.cs`, `ArchitecturesController.SealedManifestGuard.cs` — `GetArchitecture` |
| 1510 | Architecture identity LIST read guard runtime **409** mapper | same file — `ListArchitectures`, `EnsureArchitectureIdentityListSealedManifestReadAllowedAsync` |
| 1511 | Export-record pairwise compare GET `blockedReason` | `export-record-compare-blocked-reason.ts`, `export-record-compare-api.ts` — `compareExportRecords` |
| 1512 | Comparison search GET `blockedReason` | `comparison-search-blocked-reason.ts`, `comparison-record-api.ts` — `searchComparisonRecords` |
| 1513 | Comparison drift report download `blockedReason` | `comparison-drift-blocked-reason.ts`, `comparison-drift-api.ts` — `downloadComparisonDriftReport` |
| 1514 | Realized-value attestation GET `blockedReason` | `governance-stickiness-list-blocked-reason.ts`, `governance-stickiness-api-exceptions-schedules.ts` — `getRealizedValueAttestation` |
| 1515 | Reviews-awaiting + decisions-needed register GET `blockedReason` | `governance-stickiness-register-blocked-reason.ts`, `governance-stickiness-api-registers.ts` |
| 1516 | Governance posture GET `blockedReason` | `governance-posture-blocked-reason.ts`, `governance-stickiness-api-registers.ts` — `getGovernancePosture` |
| 1517 | Architecture identity list/detail GET `blockedReason` | `architecture-identity-blocked-reason.ts`, `architecture-identity-api.ts` |
| 1518 | End-to-end compare export download trigger `blockedReason` | `downloads-blob-trigger-end-to-end-compare-export.ts`, `comparison-docx-mutation-blocked-reason.ts` |
| 1519 | Governance dashboard hook fail-closed | `use-governance-dashboard-query.ts`, `governance-dashboard-blocked-reason.ts` |
| 1520 | Governance approval rationale hook fail-closed | `use-governance-approval-rationale-query.ts`, `governance-workflow-api-approvals.ts` — `getGovernanceApprovalRationale` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave127ArchitectureTests.cs`.

**Hasher baseline note:** wave 127 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** wave 60 seal-delta, export replay, and reviews hub follow-ups — see [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE128.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE128.md) (1521–1532) when opened.
