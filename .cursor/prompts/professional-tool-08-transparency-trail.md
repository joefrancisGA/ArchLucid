# PT-08 — Transparency trail is a first-class review output

## Goal

Every review Overview and sealed-package surface shows **Asserted / Inferred / Skipped (MUST vs SHOULD)** from `TransparencyTrail`. Export/sponsor packets include the same trail. A skipped MUST is loud. This is the precondition for “if ArchLucid got it wrong, the user got it wrong.”

## Why

ADR 0050 (`docs/architecture/adrs/0050-feasibility-classification-transparency-trail.md`) makes `TransparencyTrail` **mandatory**, not polish. Contracts already exist (`ArchLucid.Contracts/Architecture/TransparencyTrail.cs`, UI types in `archlucid-ui/src/types/feasibility-verdict.ts`). Intake can build a trail (`buildIntakeTransparencyTrail`). If the working UI still lets an architect proceed on silent inference, career risk transfers to them without a record they can defend.

## Context

- ADR 0050; foundational debate R4 liability conditional
- `ArchLucid.Contracts/Architecture/AssertedTrailEntry.cs`, `InferredTrailEntry.cs`, `SkippedQuestionTrailEntry.cs`
- `DraftRequestDocument.TransparencyTrail`, `ArchitectureRequest.IntakeTransparencyTrail`, `FeasibilityVerdict.TransparencyTrail`
- Review Overview / Finalized review record tabs (`review-detail-workspace-tabs.ts`)
- Provenance / claim-labeling (SAQ-011, TB-034) — compose, do not fork a new store

## What to build

1. A reusable `TransparencyTrailPanel` (own file) rendering three lists: Asserted, Inferred (with 1–100 confidence), Skipped (MUST called out). Empty trail: honest empty state, not hidden.
2. Mount on review Overview and on the sealed package tab. Working mode: expanded. Guided: available, not buried only in technical appendix.
3. If the API omits the trail on a completed review, show a defect-grade callout (“transparency record missing”) rather than inferring silence is fine. Do not fake rows.
4. Include the trail in existing export/package generation paths if those already serialize JSON/Markdown — add a section, do not invent a second PDF stack.
5. Feasibility verdict (`Feasible | SoftInfeasible | HardInfeasible`) if already on the payload: render with ADR 0050 rules (hard requires citation). If not wired in the pipeline yet, render the trail only and do not invent verdicts.
6. Vitest for panel mapping (including skipped MUST). Scoped compile if you only consume existing DTOs.

## Acceptance criteria

- An architect can answer “what did I assert vs what did ArchLucid fill?” without opening diagnostics.
- Skipped MUST questions are visible before finalize when the trail exists.
- Missing trail on a completed review is a visible defect, not a quiet absence.
- No duplicate provenance store.

## Constraints

- Do not claim Hard infeasible without a citation.
- Do not silently relax invariants in the UI.
- Tenant isolation unchanged; trail may contain user text — keep it in-tenant.
