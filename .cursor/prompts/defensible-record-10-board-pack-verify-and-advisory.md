# DR-10 — Board-pack LLM narrative is advisory; Working download requires verify

**Do not fork PC-13** honesty sentences — consume them. **Do not** generate fake frontier transcripts. **Do not** treat `NotAttested` as success on Working career download.

## Goal

1. Sponsor ROI **board-pack** optional LLM narrative (`SponsorRoiBoardPackNarrativeBuilder`) is labeled **advisory** in markdown/PDF/UI, visually quieter than sealed ROI numbers, and omitted from the career-export cover unless the operator expands “Advisory narrative.”
2. Working download of board-pack / traceability bundle **requires** `GET …/export/verify` **Attested** (or equivalent success). `NotAttested` / hash mismatch **blocks** the download with recovery copy (TB-2155 contract), not a silent file.
3. `TooLarge` returns the existing outcome **and** a Working path to a narrower export (findings-only / stamp-only) — do not leave the architect with nothing.

## Why

Board packs leave the building. Mixing LLM prose with sealed KPIs, or shipping an unattested zip, is how a livelihood-critical artifact becomes indefensible.

## Context

- `SponsorRoiBoardPackNarrativeBuilder.cs` / `SponsorRoiBoardPackExporter.cs`
- `EVIDENCE_IMMUTABILITY.md` verify status table (ADR 0040 — no platform WORM; verify is the in-product bar)
- `TraceabilityBundleExportApplicationService.cs`
- PC-13 `career-export-coverage-honesty`

## What to build

1. Advisory heading + claim-boundary sentence on narrative section.
2. Working export menu: verify-before-download; show Attested/NotAttested.
3. Tests: NotAttested → no file; Attested → file includes PC-13 honesty; narrative marked advisory.
4. Guided sample packs stay sample-labeled and may skip verify if already documented — say so in tests.

## Acceptance criteria

- Working cannot download a board pack that failed verify.
- LLM narrative cannot be mistaken for a sealed metric.

## Constraints

- Public claim boundary. No unseal. No 40th engine.
