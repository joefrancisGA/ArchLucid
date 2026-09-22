> **Scope:** Contributor-reference — wave-126 robustness controls for architecture create and review (branch `cursor/wave126-robustness-e14f`).

# Architecture create/review robustness — wave 126

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE125.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE125.md) (1485–1496 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 1497 | Setup guide bundle read runtime **409** mapper | `GovernanceSetupController.cs`, `GovernanceSetupController.SealedManifestGuard.cs` — `GetSetupGuideBundle` |
| 1498 | Governance resolution read runtime **409** mapper | `GovernanceResolutionController.cs`, `GovernanceResolutionController.SealedManifestGuard.cs` — `Resolve` |
| 1499 | Environment catalog read runtime **409** mapper | `GovernanceEnvironmentCatalogController.cs`, `GovernanceEnvironmentCatalogController.SealedManifestGuard.cs` — `Get` |
| 1500 | Reviews-awaiting-action register GET runtime **409** mapper | `GovernanceStickinessController.Registers.cs` — `GetReviewsAwaitingAction` |
| 1501 | Decisions-needed-summary register GET runtime **409** mapper | same file — `GetDecisionsNeededSummary` |
| 1502 | Realized-value attestation read runtime **409** mapper | `GovernanceStickinessController.Attestation.cs` — `GetRealizedValueAttestation` |
| 1503 | Governance scope coverage GET `blockedReason` | `governance-coverage-blocked-reason.ts`, `governance-coverage-api.ts` — `getGovernanceScopeCoverage` |
| 1504 | Setup guide fail-closed blocked-reason UX | `resolve-governance-setup-status.ts`, `GovernanceSetupGuidePageView.tsx` |
| 1505 | Governance resolution fail-closed blocked-reason UX | `use-governance-resolution-page.ts`, `GovernanceResolutionPageView.tsx` |
| 1506 | Environment catalog fail-closed hook wiring | `use-governance-environment-catalog-query.ts`, `GovernanceEnvironmentsClient.tsx` |
| 1507 | Compare agents GET `blockedReason` | `compare-agent-results-blocked-reason.ts`, `architecture-runs-compare.ts` — `compareAgentResults`, `compareAgentResultsSummary` |
| 1508 | Export lineage verify GET `blockedReason` | `export-lineage-verify-blocked-reason.ts`, `export-lineage-verify-api.ts` — `verifyRunExportLineage` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave126ArchitectureTests.cs`.

**Hasher baseline note:** wave 126 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** wave 59 architecture identity and register follow-ups — see [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE127.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE127.md) (1509–1520) when opened.
