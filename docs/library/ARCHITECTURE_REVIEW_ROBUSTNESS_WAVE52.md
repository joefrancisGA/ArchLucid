> **Scope:** Contributor-reference — wave-52 robustness controls for architecture create and review (branch `cursor/wave52-robustness-e14f`).

# Architecture create/review robustness — wave 52

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE51.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE51.md) (597–608 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 609 | Run findings list read OpenAPI **409** | `RunQueryController.Findings.cs` (`ListRunFindings`) |
| 610 | Architecture-intelligence run model read OpenAPI **409** | `ArchitectureIntelligenceController.Run.cs` (`GetRunModelAsync`) |
| 611 | Provenance alias graph reads OpenAPI **409** | `ProvenanceController.cs`, `ProvenanceController.SealedManifestGuard.cs` |
| 612 | Advisory improvements + recommendations reads OpenAPI **409** | `AdvisoryController.cs` |
| 613 | Run comparison history read OpenAPI **409** | `ComparisonsController.History.cs`, `ComparisonsController.SealedManifestGuard.cs` |
| 614 | Internal trace forensics list read OpenAPI **409** | `InternalArchitectureTraceForensicsController.cs` |
| 615 | Architecture request + advisory client sealed reads | `architecture-runs-read-list.ts`, `learning-evolution-api.ts`, `advisory-api.ts`, blocked-reason helpers |
| 616 | Provenance alias client sealed reads | `graph-api.ts`, `provenance-graph-alias-blocked-reason.ts` |
| 617 | Architecture-intelligence run model client sealed read | `architecture-intelligence-api-closed-loop.ts`, `architecture-intelligence-run-model-blocked-reason.ts` |
| 618 | Finding provenance client sealed read | `finding-provenance.ts`, `finding-provenance-blocked-reason.ts` |
| 619 | Compare picked-summary fail-closed UX | `use-compare-form-diff-submit.ts`, `CompareRunPickersSection.tsx`, `CompareForm.tsx` |
| 620 | Sponsor collateral programmatic test parity | `EmailRunToSponsorBanner.test.tsx`, `EmailRunToSponsorExportActions.tsx` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave52ArchitectureTests.cs`.

**Hasher baseline note:** wave 52 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** none.
