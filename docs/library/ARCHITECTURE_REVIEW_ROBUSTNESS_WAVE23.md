> **Scope:** Contributor-reference — wave-23 robustness controls for architecture create and review (branch `cursor/wave23-robustness-e14f`).

# Architecture create/review robustness — wave 23

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE22.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE22.md) (suggestions 211–220). Wave 24: [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE24.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE24.md) (231–240).

| # | Control | Primary wiring |
|---|---------|----------------|
| 221 | Re-run execute fail-closed on sealed `ManifestHash` + pin/inventory | `ReRunExecuteSealedManifestPinGuard`, `ReRunExecuteSealedManifestPinGate`, `ArchitectureRunCommandService`, `SelectiveExecuteIncrementalReReviewCoordinator` |
| 222 | Evidence-graph materialize fail-closed when pin not inventory-bound | `EvidenceGraphMaterializeInventoryGuard`, `EvidenceGraphMaterializer` |
| 223 | Policy-pack simulate/dry-run fail-closed without sealed `ManifestHash` | `PolicyPackSimulateSealedManifestGuard`, `PolicyPackGovernanceDryRunService` |
| 224 | ITSM inbound fail-closed unless correlated run sealed hash matches | `ItsmInboundSealedManifestHashGuard`, `ItsmInboundWebhookProcessPipeline` |
| 225 | Featured sample fail-closed unless run complete with sealed hash | `FeaturedCompletedSampleSealedManifestGuard`, `FeaturedCompletedSampleService` |
| 226 | Draft start-review fail-closed on stale `updatedUtc` / unreadiness | `DraftStartReviewStaleUpdatedUtcGuard`, `DraftAdmissionService.SubmitAndHeal.cs`, `SubmitDraftPostRequest`, guided-intake submit API |
| 227 | Sponsor proof pack ZIP fail-closed on sealed receipt | `BuyerProofPackBuilder`, `ManifestDecisionReceiptExportBinder.EnsureSealedExportReceiptVerifiedOrThrowAsync` |
| 228 | Graph snapshot compare fail-closed on pin/inventory of both runs | `GraphSnapshotComparePinInventoryGuard`, `GraphController.Snapshot.cs` |
| 229 | Board-pack PDF download rejects JSON/problem bodies | `downloads-blob-trigger-reports.ts`, `assertBinaryDownloadContentType` |
| 230 | Finding inspect fail-closed when evidence not pin/inventory-bound | `FindingInspectPinnedEvidenceGuard`, `FindingInspectController`, `RunFindingsInspectStage` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave23ArchitectureTests.cs`.

**Hasher baseline note:** wave 23 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).
