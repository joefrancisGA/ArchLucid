> **Scope:** Contributor-reference — wave-58 robustness controls for architecture create and review (branch `cursor/wave58-robustness-e14f`).

# Architecture create/review robustness — wave 58

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE57.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE57.md) (669–680 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 681 | Setup guide bundle read OpenAPI **409** | `GovernanceSetupController.cs`, `GovernanceSetupController.SealedManifestGuard.cs` |
| 682 | Governance resolution read OpenAPI **409** | `GovernanceResolutionController.cs`, `GovernanceResolutionController.SealedManifestGuard.cs` |
| 683 | Environment catalog read OpenAPI **409** | `GovernanceEnvironmentCatalogController.cs`, `GovernanceEnvironmentCatalogController.SealedManifestGuard.cs` |
| 684 | Reviews-awaiting-action register guard + OpenAPI **409** | `GovernanceStickinessController.Registers.cs`, `GovernanceStickinessFacade.cs` |
| 685 | Decisions-needed-summary register guard + OpenAPI **409** | `GovernanceStickinessController.Registers.cs`, `GovernanceStickinessFacade.cs` |
| 686 | Realized-value attestation read register guard + OpenAPI **409** | `GovernanceStickinessController.Attestation.cs`, `GovernanceStickinessFacade.Recurrence.cs` |
| 687 | Governance scope coverage sealed client | `governance-coverage-api.ts`, `use-governance-scope-coverage-query.ts`, `governance-coverage-blocked-reason.ts` |
| 688 | Setup guide fail-closed blocked-reason wiring | `resolve-governance-setup-status.ts`, `GovernanceSetupGuidePageView.tsx` |
| 689 | Governance resolution fail-closed blocked-reason wiring | `use-governance-resolution-page.ts`, `GovernanceResolutionPageView.tsx` |
| 690 | Environment catalog fail-closed hook wiring | `use-governance-environment-catalog-query.ts` |
| 691 | Compare agents sealed clients | `architecture-runs-compare.ts`, `use-compare-agent-results-query.ts`, `compare-agent-results-blocked-reason.ts` |
| 692 | Export lineage verify sealed client | `export-lineage-verify-api.ts`, `use-export-lineage-verify-query.ts`, `export-lineage-verify-blocked-reason.ts` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave58ArchitectureTests.cs`.

**Hasher baseline note:** wave 58 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** none.
