> **Scope:** Contributor-reference — wave-20 robustness controls for architecture create and review (branch `robust`).

# Architecture create/review robustness — wave 20

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE19.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE19.md) (suggestions 181–190).

| # | Control | Primary wiring |
|---|---------|----------------|
| 191 | ZIP export fail-closed when sealed receipt fields missing | `RunExportAuthorityMaterialLoader`, `RunExportPackageBuilder` |
| 192 | Blob-push fail-closed on sealed-receipt mismatch | `RunExportBlobPushOutboxProcessor` |
| 193 | Missing sealed receipt fields → distinct 409 | `DecisionReceiptService`, `ArtifactExportController.Export.Download.cs`, `ProblemTypes` |
| 194 | Review-board DOCX/PDF/HTML verifies sealed receipt | `ArchitectureReviewExportService` |
| 195 | Run-id compare diffs inventory-checked projection | `CompareRunsApplicationFacade`, `ManifestCompareInventoryCheckedDocumentBuilder` |
| 196 | End-to-end replay enforces pin/inventory | `EndToEndReplayComparisonService`, `ICompareRunsApplicationFacade` |
| 197 | Agent compare emits `InputFingerprints` | `CompareRunsApplicationFacade`, `AgentResultDiffResult`, `RunComparisonController.Agents.cs` |
| 198 | Recovery binds receipt version from sealed document | `AuthorityDrivenArchitectureRunCommitOrchestrator` |
| 199 | Export lineage fail-closed on sealed `ManifestHash` | `RunExportLineageVerifier` |
| 200 | Finding read fail-closed on invalid/missing anchors | `FindingJsonConverter` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave20ArchitectureTests.cs`.

**Hasher baseline note:** wave 20 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read-path sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

Next: [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE21.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE21.md) (suggestions 201–210).
