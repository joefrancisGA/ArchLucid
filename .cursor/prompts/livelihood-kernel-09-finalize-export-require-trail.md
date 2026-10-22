# LK-09 — Finalize and career exports require a complete trail

**Do not fork FD-05** if the stamp already *displays* a trail — this file is the **gate**, not another band. **Do not fork IS-06** classification counts. Product of ADR 0073.

## Goal

Working `finalize` (API) returns a structured 4xx when `TransparencyTrail` is missing or incomplete per 0073. Stamp, print, sponsor PDF, decision-receipt JSON, and the review-detail trail region either show the three sections or **refuse to render as a sealed career artifact**. UI copy names the missing bucket (asserted / inferred / skipped). Guided shows the same block on finalize.

Historical sealed records without a trail: honesty banner on export, no byte rewrite (ADR 0039).

## Why

A trail that is optional on the happy path will be skipped under time pressure. The livelihood assumption is that the stamp is what people take into the ARB.

## Context

- ADR 0073 (LK-08)
- Finalize controller / application service (grep `Finalize` on architecture runs)
- `RunDetailOverviewTransparencyTrail` / FD-05
- `export-transparency-trail-section.ts`
- Sponsor packet / print (CD-05/06/IS-06 leftovers)
- `isExportableDecisionVerdict` / decision receipt

## What to build

1. Server: validate trail completeness before seal. One class per file for the validator. Check nulls. Tests in Core/Application — no `ConfigureAwait(false)` in tests.
2. UI: finalize CTA disabled or error-on-form (TB-2005) when the client already knows the trail is missing; still fail closed if the client is stale.
3. Exports: generators call the same completeness helper. Missing trail ≠ empty PDF that looks official.
4. Vitest + C# tests: fixture without trail cannot finalize; fixture with empty arrays can; old sealed export shows honesty, not a fake trail.

## Acceptance criteria

- A Working architect cannot stamp a package that has no asserted/inferred/skipped sections.
- Hard infeasible without a citation still cannot be labeled Hard (R5) — do not invent a law.
- Sealed bytes are not rewritten.

## Constraints

- Do not change `DeterministicInsightDensityGate`.
- Do not add engines.
- Scoped compile: project that owns finalize.
