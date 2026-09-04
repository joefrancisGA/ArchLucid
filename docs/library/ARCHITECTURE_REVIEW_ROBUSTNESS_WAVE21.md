> **Scope:** Contributor-reference — wave-21 robustness controls for architecture create and review (branch `robust`).

# Architecture create/review robustness — wave 21

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE20.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE20.md) (suggestions 191–200).

| # | Control | Primary wiring |
|---|---------|----------------|
| 201 | Sponsor review packet fail-closed on sealed receipt readiness | `SponsorReviewPacketBuilder`, `ManifestDecisionReceiptExportBinder`, `PilotsController.Packs.cs` |
| 202 | Version-string compare applies inventory-checked topology overlay | `CompareRunsApplicationFacade.VersionCompare.cs`, `ManifestCompareInventoryCheckedDocumentBuilder` |
| 203 | Explain-compare routes through pin/inventory facade | `ExplanationController.CompareHolistic.cs`, `ICompareRunsApplicationFacade` |
| 204 | Audit export fail-closed when row cap would silently truncate | `AuditController.Export.Guard.cs`, `AuditController.Export.Download.cs`, `ProblemTypes.AuditExportRowCapExceeded` |
| 205 | Governance mutation correction binds to run-scoped sealed `ManifestHash` | `GovernanceMutationCorrectionService`, `ManifestDecisionReceiptExportBinder` |
| 206 | Authority manifest-id compare enforces pin/inventory fingerprints | `AuthorityCompareController`, `AuthorityManifestIdCompareGuard` |
| 207 | UI blob download rejects JSON/problem bodies saved as ZIP exports | `downloads-blob-trigger.ts`, `assertBinaryDownloadContentType` |
| 208 | Signed review record GET fail-closed on sealed `ManifestHash` | `AuthorityQueryController.Trail.cs`, `ArtifactExportController.SealedManifestGuard.cs` |
| 209 | Skip-persist finalize/recovery fail-closed when decision-trace inventory missing | `ManifestFinalizationService.Artifacts.cs`, `ManifestCommittedArtifactInventoryCapturer`, `AuthorityCommitRecoveryVerifier` |
| 210 | Finding write fail-closed on missing/invalid anchors | `FindingJsonConverter` (Write), `ArchitectureFindingJsonConverter` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave21ArchitectureTests.cs`.

**Hasher baseline note:** wave 21 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).
