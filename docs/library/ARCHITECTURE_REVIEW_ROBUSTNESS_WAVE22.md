> **Scope:** Contributor-reference — wave-22 robustness controls for architecture create and review (branch `robust`).

# Architecture create/review robustness — wave 22

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE21.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE21.md) (suggestions 201–210).

| # | Control | Primary wiring |
|---|---------|----------------|
| 211 | Batch replay ZIP fail-closed on pin/inventory | `ComparisonBatchReplayPinInventoryGuard`, `ComparisonsApplicationService.DriftAndBatch.cs`, `ComparisonsController.Replay.cs` |
| 212 | Comparison verify/regenerate fail-closed on sealed `ManifestHash` | `ComparisonReplayManifestHashGuard`, `ComparisonReplayService` |
| 213 | Consulting DOCX fail-closed on sealed receipt | `AnalysisReportsController.ConsultingDocx.Download.cs`, `ManifestDecisionReceiptExportBinder` |
| 214 | First-value PDF fail-closed on sealed receipt | `FirstValueReportBuilder`, `PilotsController.Packs.cs` |
| 215 | Terraform advisory ZIP/PR fail-closed on sealed `ManifestHash` | `ArtifactExportController.Export.Download.cs`, `ArtifactExportController.Export.Push.cs`, `ArtifactExportController.SealedManifestGuard.cs` |
| 216 | Mermaid diagram export fail-closed when not inventory-bound | `MermaidDiagramExportInventoryGuard`, `ArtifactExportController.Export.Download.cs` |
| 217 | Run export history fail-closed when lineage unverified | `RunExportQueryFacade`, `RunExportLineageVerifier`, `ExportsController` |
| 218 | Governance disposition binds sealed `ManifestHash` | `GovernanceDispositionSealedManifestGuard`, `GovernanceStickinessFacade.Findings.Dispositions.cs`, `RunOperatorGovernanceDispositionService` |
| 219 | Digest webhook + integration outbox require `manifestHash` | `IntegrationEventOutboxManifestHashGuard`, `DigestDeliveryManifestHashGuard`, finalization/outbox payloads |
| 220 | Draft intake submit validates `ArchitectureRequest` | `DraftAdmissionService.SubmitAndHeal.cs`, `IValidator<ArchitectureRequest>` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave22ArchitectureTests.cs`.

**Hasher baseline note:** wave 22 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).
