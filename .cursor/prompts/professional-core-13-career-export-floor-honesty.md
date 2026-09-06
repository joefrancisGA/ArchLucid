# PC-13 — Career exports include floor + quiet-engine honesty

**Do not fork WA-08 / CD-06 / CD-15** — centralize sentences. **Do not fork PC-01** — consume its helper. **Do not change** `typed-engine-protected` gate.

## Goal

Working-mode **sponsor PDF**, **product documentation PDF**, **consulting DOCX**, **ADR export**, and **print packet** reuse one shared honesty module that includes:

1. **Measurement floor** sentence from PC-01 (catalog / measured / harness).
2. **Quiet engines** not run or with zero findings (existing `sponsor-review-coverage-honesty` patterns).
3. **Skipped MUST** and **infeasible** verdict when present on the package.
4. **Checklist vs Decision-grade** band counts post–ADR 0070.

Exports **refuse** (or watermark “incomplete for career use”) when PC-01 floor gate fails — same rule as finalize scorecard.

## Why

Sponsor screenshots cleaner than the review is a **career-ending** false confidence. Overlays fixed in-app; exports are what auditors email.

## Context

- `career-desk-06-print-packet-honesty.md`, `career-desk-15-sponsor-pdf-remaining-honesty.md`
- `copy-finding-as-work-item-coverage-honesty.ts`
- Export builders in Application + UI formatters
- PC-01 measurement helper

## What to build

1. Extract `career-export-coverage-honesty.ts` (+ C# mirror if needed) consumed by all export paths.
2. Wire PC-01 block at top of export cover section.
3. Vitest per format: incomplete floor → export blocked or watermarked with explicit reason.
4. Guided sample packets stay labeled sample.

## Acceptance criteria

- No export path summarizes findings without the shared honesty block.
- Single source of truth — no second claim language per format.

## Constraints

- Do not fake frontier transcripts. Public claim boundary guide.
