> **Scope:** Contributor-reference — wave-140 robustness controls for architecture create and review (branch `cursor/wave140-robustness-e14f`).

# Architecture create/review robustness — wave 140

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE139.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE139.md) (1653–1664 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 1665 | First-value report PDF POST runtime **409** mapper | `PilotsController.Packs.cs` — `PostFirstValueReportPdf`; `PilotsController.SealedManifestGuard.cs` |
| 1666 | Sponsor one-pager PDF POST runtime **409** mapper | `PilotsController.Packs.cs` — `PostSponsorOnePager`; `PilotsController.SealedManifestGuard.cs` |
| 1667 | Board-pack PDF POST runtime **409** mapper | `PilotsBoardPackController.cs` — `PostBoardPackPdf`; `PilotsBoardPackController.SealedManifestGuard.cs` |
| 1668 | Architecture-intelligence run POST runtime **409** mapper | `ArchitectureIntelligenceController.Run.cs` — `PostRunAsync`; `ArchitectureIntelligenceController.SealedManifestGuard.cs` |
| 1669 | Architecture-intelligence continue/publish POST runtime **409** mapper | `ArchitectureIntelligenceController.Run.cs` — `PostContinueAsync`, `PostPublishAsync`; `ArchitectureIntelligenceController.SealedManifestGuard.cs` |
| 1670 | Batch create POST runtime **409** mapper | `RunsController.Create.Batch.cs` — `CreateRunBatch`; `RunsController.SealedManifestGuard.cs` |
| 1671 | Architecture-intelligence mutation `blockedReason` | `architecture-intelligence-run-mutation-blocked-reason.ts`, `use-architecture-intelligence-actions.ts` |
| 1672 | Board-pack PDF mutation `blockedReason` | `board-pack-mutation-blocked-reason.ts`, `use-pilot-value-report-pilot-page.ts` |
| 1673 | First-value report PDF mutation `blockedReason` (UI parity) | `first-value-report-mutation-blocked-reason.ts`, `ManifestDeliverableGrid.tsx`, `CtoDemoRecapCard.tsx`, `CtoDemoAuditClosingBeat.tsx` |
| 1674 | Sponsor value-report DOCX mutation `blockedReason` | `sponsor-value-report-docx-mutation-blocked-reason.ts`, `GenerateSponsorValueReportButton.tsx`, `use-pilot-value-report-pilot-page.ts` |
| 1675 | Sponsor one-pager PDF mutation `blockedReason` | `sponsor-one-pager-mutation-blocked-reason.ts`, `downloadSponsorOnePagerPdf`, `SponsorExportsSection.tsx` |
| 1676 | Risk-exception revoke sealed guard | `GovernanceStickinessFacade.Findings.RiskExceptions.cs` — `RevokeRiskExceptionAsync` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave140ArchitectureTests.cs`.

**Hasher baseline note:** wave 140 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** see [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE141.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE141.md) (1677–1688) for wave-73 follow-ups (861–872).
