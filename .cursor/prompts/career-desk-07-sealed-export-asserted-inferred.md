# CD-07 — Sealed export states asserted vs inferred vs Unknown

**Do not fork RS-12** for the intake projector (Unknown must not become graph/requirement nodes). This file is **exports**: sealed JSON, ADR download, and decision-receipt files can omit R4’s asserted / inferred / skipped trail even when the UI panel has it.

## Goal

Working-mode sealed-record export, ADR from review, and decision-receipt JSON include a compact asserted vs inferred vs skipped-MUST (and Unknown-not-architecture) section. Do not rewrite history. Do not treat Unknown as a requirement in the file. Sealed immutability stays; this is labeling on the export payload/markdown, not a silent graph rewrite.

## Why

The transparency trail is the precondition that earns “the user got it wrong.” An export that looks like a spec while half the triples were inferred is a career event after the meeting.

## Context

- `docs/ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md` R4
- `TransparencyTrailPanel.tsx` — reuse fields, do not fork copy
- `decision-receipt-export.ts` / `DecisionReceiptExportButton.tsx`
- `GenerateAdrFromRunModal.tsx`
- Golden manifest / sealed record download path
- RS-12 projector — do not reopen; if Unknown still appears as a node, fail closed in the **export** label (“not confirmed architecture”) without changing `typed-engine-protected`

## What to build

1. Export builders include trail summary: counts or lists of asserted / inferred / skipped MUST. Unknown placeholders labeled as not architecture.
2. ADR markdown: a short Provenance section with the same split (R4).
3. Vitest: fixture with inferred-only triples cannot produce an export that reads as fully asserted. No new coverage engine.

## Acceptance criteria

- A downloaded Working package cannot omit the trail the UI already knows.
- Unknown is not exported as a confirmed requirement.
- Guided may include a shorter trail; do not strip it on Working.

## Constraints

- Do not weaken sealed-manifest immutability (append-only labels, not rewrite).
- Do not change `typed-engine-protected`.
- All SQL DDL in the single database file if a column is required (prefer reusing trail JSON already on the run).
