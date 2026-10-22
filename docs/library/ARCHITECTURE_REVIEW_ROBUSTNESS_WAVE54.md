> **Scope:** Contributor-reference — wave-54 robustness controls for architecture create and review (branch `cursor/wave54-robustness-e14f`).

# Architecture create/review robustness — wave 54

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE53.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE53.md) (621–632 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 633 | Review-trail export read OpenAPI **409** | `AuthorityReadsController.cs` (`GetReviewTrailExport`) |
| 634 | Export record read OpenAPI **409** | `ExportsController.cs`, `ExportsController.SealedManifestGuard.cs` |
| 635 | Export-record comparison history read OpenAPI **409** | `ComparisonsController.History.cs` |
| 636 | Comparison record + summary reads OpenAPI **409** | `ComparisonsController.History.cs`, `ComparisonsController.SealedManifestGuard.cs` |
| 637 | Coordinator provenance read guard parity | `RunQueryController.Provenance.cs` (`GetArchitectureRunProvenance`) |
| 638 | Provenance node explanation read OpenAPI **409** | `RunQueryController.Provenance.cs` (`GetProvenanceNodeExplanation`) |
| 639 | Governance workflow approvals/promotions sealed reads | `governance-workflow-api-approvals.ts` |
| 640 | Governance workflow activations sealed read | `governance-workflow-api-environments.ts` |
| 641 | Governance workflow run-list blocked-reason hook | `use-governance-workflow-run-lists-query.ts`, `governance-workflow-run-read-blocked-reason.ts` |
| 642 | Run export history query hook | `use-run-export-history-query.ts`, `run-export-history-api.ts` |
| 643 | Review-trail provenance canonical sealed read | `architecture-runs-read-detail-artifacts.ts` (`getRunProvenance` → `/v1/runs/.../review-trail/provenance`) |
| 644 | Export-record comparison history client | `export-record-comparison-api.ts`, `export-record-comparison-history-blocked-reason.ts` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave54ArchitectureTests.cs`.

**Hasher baseline note:** wave 54 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** see [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE55.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE55.md) (645–656).
