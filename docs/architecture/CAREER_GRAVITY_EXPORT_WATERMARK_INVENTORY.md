> **Scope:** Shrink-only inventory — stamp / sponsor PDF / print / DOCX / ADR / decision-receipt JSON / audit CSV / CLI-API bundles that can omit rehearsal honesty when structural Mode is Simulator. **Do not add validators in this file.** CG-022+ owns mutations.

> **Spine:** ADR **0091** · ADR **0078** · FC-02/03 · LP-06 · CG-003

# Career-gravity export watermark inventory

**Last reviewed:** 2026-09-11

ADR **0091**: Simulator is not the unlabeled Working day. A watermark-free PDF is how Simulator becomes an ARB exhibit.

**Do not add Working career-export surfaces** without a row here. Shrink rows when CG-022+ stamps or blocks; do not grow the set without a named leftover.

Reuse, do not re-run: `evaluateCareerArtifactHonesty`, `CareerArtifactCompletenessValidator`, `CAREER_EXPORT_MOUNTED_UI_PATHS`.

## Gravity gap (quote this)

**CG-022 (shipped):** `CareerArtifactCompletenessInputMapper.ResolveSimulatorRehearsalBannerOnArtifactForExport` sets `SimulatorRehearsalBannerOnArtifact` only when structural Mode is Simulator/Fallback **and** `WorkingCareerRehearsalDoor` is **Rehearsal**. Working Career + Simulator exports **fail closed** server-side unless bytes carry a real rehearsal banner.

`SimulatorCareerHonestyPresenter.ShouldBlockWorkingCareer` still blocks unlabeled Working Career Simulator paths when the door stamp is Career.

UI `evaluateCareerArtifactHonesty` does **not** default the banner flag. Mounted UI formatters that omit `simulatorRehearsalBannerOnArtifact` therefore **fail closed** on Working Career Simulator. **Do not** treat the mapper flag as proof PDF bytes are watermarked — CG-042+ owns visual rehearsal stamps on sponsor PDF bytes.

## Leak classes

| Class | Meaning | Typical owner |
|-------|---------|---------------|
| **covered** | Honesty evaluator/gate is called; Working Career Simulator is blocked unless a real banner flag is true | leftover only if a call site skips the helper |
| **assumed-banner** | Gate is called, but the banner flag is inferred from Mode (not from bytes) | CG-022–CG-044 |
| **bypass** | Bytes leave without `EnsureCanExport` / `evaluateCareerArtifactHonesty` | CG-026–CG-028 |
| **eval-ok** | Guided / demo / sample waiver — not Working Career gravity | leave |
| **related** | Not a career packet, but screenshot-able as proof | CG-026 leftover |

## Guided / demo waiver paths (not Working Career)

| Path | Waiver | Notes |
|------|--------|-------|
| `archlucid-ui/src/lib/career-export-demo-chrome.ts` | Demo vs live chrome (`usedStaticDemoRun`, static demo env) | Sample / demo banner — not rehearsal-on-Working |
| `archlucid-ui/src/lib/governance/simulator-career-honesty.ts` | `SIMULATOR_REHEARSAL_GUIDED_WARNING` | Guided warning when **not** Working desk |
| `archlucid-ui/src/lib/career-rehearsal-help-guide-content.ts` | Guided help copy | Eval teaching |
| `ArchLucid.Application/Pilots/FirstValueReportPdfBuilder.cs` | Demo-only / incomplete **sponsor-circulation** watermarks | Completeness/demo ROI — **not** Simulator rehearsal labeling |

Working Career must not be confused with these waivers.

## Mounted UI honesty surfaces (FC — do not re-run)

`CAREER_EXPORT_MOUNTED_UI_PATHS` already requires `evaluateCareerArtifactHonesty`. CG-003 records **watermark vs assumed-banner**, not a new FC guard.

| Path | Validator call | Rehearsal/demo copy on bytes | Leak class | Owner |
|------|----------------|-----------------------------|------------|-------|
| `archlucid-ui/src/components/GoldenManifestExportMenu.tsx` | **Yes** | Honesty markdown via `formatCareerExportHonestyMarkdown`; banner flag **not** passed | covered | CG-022 leftover if bytes still unlabeled after a server round-trip |
| `archlucid-ui/src/components/GenerateAdrFromRunModal.tsx` | **Yes** | Honesty markdown prepended to ADR | covered | CG-024 |
| `archlucid-ui/src/app/(operator)/architecture/reviews/[reviewId]/print/_sections/PackagePrintPageClient.tsx` | **Yes** | Door-stamp rehearsal strip (print-only); repeating watermark is CG-041 | covered | CG-041 |
| `archlucid-ui/src/lib/export-markdown.ts` | **Yes** | Honesty markdown + demo chrome helper | covered | CG-022 |
| `archlucid-ui/src/lib/sealed-manifest-json-export.ts` | **Yes** | Working fail-closed; no rehearsal JSON flag unless honesty input carries it | covered | CG-044 |
| `archlucid-ui/src/components/reviews/RunDetailCareerArtifactHonestyStrip.tsx` | **Yes** | Screen strip, not a file | covered | CG-029 adjacent |
| `archlucid-ui/src/components/use-email-run-to-sponsor-banner.ts` | **Yes** | Blocks send; not a watermarked attachment | covered | CG-029 |

## Server export gates

| Path | Validator call | Rehearsal watermark on artifact | Leak class | Owner |
|------|----------------|----------------------------------|------------|-------|
| `ArchLucid.Application/Exports/CareerArtifactCompletenessInputMapper.cs` | Door-stamp-aware `ResolveSimulatorRehearsalBannerOnArtifactForExport` | Banner only when Rehearsal door + Simulator | **covered** | CG-022 |
| `ArchLucid.Application/Exports/CareerArtifactExportCompletenessGate.cs` | `EnsureCanExport` / `FromHonestyMaterial` | Inherits mapper | covered | CG-022 |
| `ArchLucid.Application/Exports/SponsorReviewPacketBuilder.cs` | `EnsureCanExportFromHonestyMaterial` | Coverage honesty markdown; rehearsal via mapper | covered | CG-022 |
| `ArchLucid.Application/Exports/RunSummaryOnePagerExportService.cs` | **Yes** | Same | covered | CG-022 |
| `ArchLucid.Application/Exports/ArchitectureReviewExportService.cs` | **Yes** | Same | covered | CG-022 |
| `ArchLucid.Application/Analysis/ExportReplayService.cs` | **Yes** | Replay ZIP inherits mapper | assumed-banner | CG-027 |
| `ArchLucid.Api/Controllers/Authority/DocxExportController.cs` | `EnsureCanExport` + plain-text honesty section | DOCX gets coverage honesty text; rehearsal banner assumed | assumed-banner | CG-043 |
| `ArchLucid.Application/Exports/DecisionReceiptService.cs` | `MapForExport` | JSON receipt; no visual watermark | assumed-banner | CG-025 / CG-044 |
| `ArchLucid.Application/Pilots/FirstValueReportBuilder.cs` | `MapForExport` | Markdown honesty; PDF sibling uses **sponsor-circulation** watermarks | assumed-banner | CG-022 / CG-042 |
| `ArchLucid.Application/Runs/Orchestration/AuthorityDrivenArchitectureRunCommitOrchestrator.cs` | `MapForFinalize` (banner defaults **false**) | Finalize **does** block unlabeled Working Simulator | covered | CG-021 |
| `ArchLucid.Api/Controllers/Authority/ArtifactExportController.Export.Download.cs` | ZIP `GET …/export` — **no** `EnsureCanExport` | Sealed-hash only | **bypass** | CG-028 |
| `ArchLucid.Api/Controllers/Authority/ArtifactExportController.Export.Push.cs` | Blob push — **no** career gate | Same ZIP contents | **bypass** | CG-028 |
| `ArchLucid.Api/Controllers/Admin/AuditController.Export.Csv.cs` | Sealed-manifest guard only | CSV of audit rows; no rehearsal column | related | CG-026 |
| `ArchLucid.Api/Controllers/Findings/FindingVerificationController.Export.cs` | Markdown/DOCX of verification report | No career honesty mapper | **bypass** | CG-026 |
| `ArchLucid.Cli/Commands/PilotProofPacketStructuralExecutionModeFormatter.cs` | Caveat line from deltas JSON | Mode-labeled markdown, not a page watermark | covered (caveat) | CG-027 / CG-045 |
| `ArchLucid.Cli/Commands/FirstValueReportCommand.cs` | Downloads API markdown | Honesty is whatever the API emitted | assumed-banner | CG-027 |
| `ArchLucid.Cli/Commands/ProofPacketCommand.cs` | Claim lint; mode caveat via formatter | Bundle can still look Career-complete | assumed-banner | CG-027 |

## Shrink rules

1. **Do not grow** this table with unlabeled Working export surfaces. New surfaces fail Vitest until listed — then CG-022+ must stamp or block, then drop or reclassify the row.
2. **Do not add validators** from this inventory (CG-022+).
3. Guided / demo / sample waivers stay **eval-ok**. They must remain listed so they cannot hide as unlabeled Working Career.
4. Ratchet: `career-gravity-export-watermark-inventory.test.ts`.

## Intentional — do not “fix” from this inventory

- Desktop review **More** menu.
- Host `AgentExecution:Mode` default Simulator.
- FC-02/03 honesty helpers (already shipped).
- Guided / demo watermark teaching.
