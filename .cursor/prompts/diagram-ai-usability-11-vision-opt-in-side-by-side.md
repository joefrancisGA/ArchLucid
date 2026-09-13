# DAU-11 — Vision opt-in side-by-side per-shape accept

**Wave:** diagram-ai-usability (**DAU**). **Depends on:** DAU-01 (ADR 0101). Vision API already shipped (IE-20). **Do not** implement DAU-12.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Give Working operators an **explicit opt-in desk** to interpret a stored PNG/JPEG: pixels | proposed nodes/edges | honesty strip. Accept per shape. Unaccepted shapes stay **NotVerifiable**. Do **not** enable `ArchLucid:DiagramVision:Enabled` by default.

## Why

ADR 0084 / AS-040: vision is Working opt-in, default off. The API `POST /v1/architecture/runs/{runId}/diagrams/vision-ingest` exists. The usability hole is consent and accept, not another interpreter. Pixel attachments are otherwise a dead NotVerifiable band.

## Context

- `ArchLucid.Api/Controllers/InfraEvidence/ArchitectureDiagramVisionIngestController.cs`
- `ArchLucid.Application/InfraEvidence/VisionDiagramIngestService.cs`
- `ArchLucid.Contracts/Architecture/VisionDiagramHonestyLabels.cs` — “AI interpretation (not observed Azure state).”
- `ArchLucid.Contracts/Architecture/VisionDiagramIngestResult.cs`
- `ArchLucid.Core/Configuration/DiagramVisionOptions.cs` — default `false`
- `ArchLucid.ContextIngestion/Diagram/VisionDiagramModelValidator.cs`
- ESI inspect: stored file catalog (do not replace ESI)
- `docs/library/ARCHITECTURE_REVIEW_DIAGRAM_INPUT_CONTRACT.md`
- Pixel warnings: `archlucid-ui/src/lib/architecture-spine/pixel-diagram-not-verifiable-warnings.ts`

## What to build

1. Operator UI on the architecture evidence / diagram sources strip (AS-044 / `ArchitectureIdentityDeskDiagramSourcesStrip`): when a stored file is pixel + NotVerifiable **and** the host has vision enabled, show outline **Interpret with AI** (not primary). When the flag is off, helper copy: “Pixel diagrams stay NotVerifiable unless an administrator enables diagram vision.” Do not imply analysis already ran.
2. Dialog: left preview of the stored image (ESI inspect URL); right proposed model as a compact node/edge list (not a second mermaid SoT). Honesty strip uses `VisionDiagramHonestyLabels.InterpretationDisclaimer`.
3. Per-shape checkboxes; primary **Accept selected** disabled until ≥1 selected (TB-2005). Accepted shapes merge into the review diagram model as `inferred` + `ExtractionMethod=VisionOptIn`. Unchecked remain NotVerifiable on the desk.
4. Fail closed: 409 sealed manifest (existing guard) surfaces inline; Simulator interpreter path stays available when `UseSimulator`.
5. Vitest: flag off hides Interpret CTA; flag on does not auto-POST; accept merges only selected ids; copy includes the honesty label.
6. **Do not** change host default config. **Do not** add `image/*` to authority `documents[]`.

## Acceptance criteria

- Default product config still 404s/hides vision ingest.
- Accepting two of five proposed shapes does not mint the other three as resources (R5).
- Marketing/help strings in this UI never say “we analyze your PNG” without opt-in having run.

## Constraints

- Working-tree safety script before tracked edits.
- Tenant isolation unchanged. Prompt redaction on any new completion call (prefer existing ingest service).
- No new Azure collector. No tab collapse.
- Verification: focused Vitest + existing `VisionDiagramModelValidatorTests` / controller 409 tests if you touch C#.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
