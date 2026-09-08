> **Scope:** Contributor-reference — wave-40 robustness controls for architecture create and review (branch `cursor/wave40-robustness-e14f`).

# Architecture create/review robustness — wave 40

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE39.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE39.md) (453–464 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 465 | Infra-evidence **Ask** sealed-manifest **409 UX** parity | `infra-evidence-ask-api.ts`, `formatInfraEvidenceSealedManifestAwareApiError` |
| 466 | Infra-evidence **Hub** sealed-manifest **409 UX** parity | `infra-evidence-hub-api.ts` |
| 467 | Infra-evidence **Drift/snapshot** sealed-manifest **409 UX** parity | `infra-evidence-drift-api.ts` |
| 468 | Infra-evidence **Mermaid** sealed-manifest **409 UX** parity | `infra-evidence-mermaid-api.ts` |
| 469 | **Holistic critic** UI fail-closed for sealed-manifest **409** | `holistic-critic-blocked-reason.ts`, `RunDetailHolisticCriticPanel.tsx` |
| 470 | **Email run-to-sponsor** secondary download links UI fail-closed | `EmailRunToSponsorExportActions.tsx` |
| 471 | **Pilot ROI validation handoff** ROI source freshness UI | `PilotRoiValidationHandoffCard.tsx` |
| 472 | **Pilot ROI validation verdict** fail-closed for ROI freshness | `pilot-roi-validation-handoff.ts` |
| 473 | **Sponsor dashboard** scoped-review ROI freshness UI | `SponsorRoiSummarySection.tsx`, `SponsorRoiBoardPackEvidenceBanner.tsx` |
| 474 | **Run detail AI readiness gate** ROI freshness honesty | `RunDetailAiReadinessGateCard.tsx` |
| 475 | **Reference evidence admin export** lifecycle/sealed-hash fail-closed | `ReferenceEvidenceAdminExportService.cs` |
| 476 | **Reference evidence admin** OpenAPI **409** declaration | `ReferenceEvidenceAdminController.cs`, `ReferenceEvidenceAdminZipResultFactory.cs` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave40ArchitectureTests.cs`.

**Hasher baseline note:** wave 40 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** see [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE41.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE41.md) (477–488).
