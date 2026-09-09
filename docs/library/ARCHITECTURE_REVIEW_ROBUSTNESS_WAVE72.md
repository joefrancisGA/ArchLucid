> **Scope:** Contributor-reference — wave-72 robustness controls for architecture create and review (branch `cursor/wave72-robustness-e14f`).

# Architecture create/review robustness — wave 72

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE71.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE71.md) (837–848 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 849 | First-value report PDF POST OpenAPI **409** | `PilotsController.Packs.cs` — `PostFirstValueReportPdf`; `PilotsController.SealedManifestGuard.cs` |
| 850 | Sponsor one-pager PDF POST OpenAPI **409** | `PilotsController.Packs.cs` — `PostSponsorOnePager`; `PilotsController.SealedManifestGuard.cs` |
| 851 | Board-pack PDF POST OpenAPI **409** | `PilotsBoardPackController.cs` — `PostBoardPackPdf`; `PilotsBoardPackController.SealedManifestGuard.cs` |
| 852 | Architecture-intelligence run POST OpenAPI **409** | `ArchitectureIntelligenceController.Run.cs` — `PostRunAsync`; `ArchitectureIntelligenceController.SealedManifestGuard.cs` |
| 853 | Architecture-intelligence continue/publish POST OpenAPI **409** | `ArchitectureIntelligenceController.Run.cs` — `PostContinueAsync`, `PostPublishAsync`; `ArchitectureIntelligenceController.SealedManifestGuard.cs` |
| 854 | Batch create POST OpenAPI **409** | `RunsController.Create.Batch.cs` — `CreateRunBatch`; `RunsController.SealedManifestGuard.cs` |
| 855 | Architecture-intelligence mutation `blockedReason` | `architecture-intelligence-run-mutation-blocked-reason.ts`, `use-architecture-intelligence-actions.ts` |
| 856 | Board-pack PDF mutation `blockedReason` | `board-pack-mutation-blocked-reason.ts`, `use-pilot-value-report-pilot-page.ts` |
| 857 | First-value report PDF mutation `blockedReason` (UI parity) | `first-value-report-mutation-blocked-reason.ts`, `ManifestDeliverableGrid.tsx`, `CtoDemoRecapCard.tsx`, `CtoDemoAuditClosingBeat.tsx` |
| 858 | Sponsor value-report DOCX mutation `blockedReason` | `sponsor-value-report-docx-mutation-blocked-reason.ts`, `GenerateSponsorValueReportButton.tsx`, `use-pilot-value-report-pilot-page.ts` |
| 859 | Sponsor one-pager PDF mutation `blockedReason` | `sponsor-one-pager-mutation-blocked-reason.ts`, `downloadSponsorOnePagerPdf`, `SponsorExportsSection.tsx` |
| 860 | Risk-exception revoke sealed guard | `GovernanceStickinessFacade.Findings.RiskExceptions.cs` — `RevokeRiskExceptionAsync` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave72ArchitectureTests.cs`.

**Hasher baseline note:** wave 72 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** none — see [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE73.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE73.md) (861–872).
