# PT-08 — Transparency trail is a first-class review output

## Goal

Every review **Overview** and the **pre-finalize** path show **Asserted / Inferred / Skipped (MUST vs SHOULD)** from `TransparencyTrail`. A skipped MUST is loud before the architect finalizes. Missing trail on a completed review is a defect callout. Do not hide this only under the sealed-record feasibility section.

## Why

ADR 0050 (`docs/architecture/adrs/0050-feasibility-classification-transparency-trail.md`) makes `TransparencyTrail` **mandatory**, not polish. The liability stance “if ArchLucid got it wrong, the user got it wrong” is only fair when the architect can see what they asserted vs what the product filled. `TransparencyTrailPanel` already exists and mounts from `RunDetailFeasibilityVerdictSection` on the manifest summary. That is too late and too buried for all-day use. Career risk transfers to the architect without a record they can defend in the room.

## Context

- ADR 0050; foundational debate R4 liability conditional
- `ArchLucid.Contracts/Architecture/AssertedTrailEntry.cs`, `InferredTrailEntry.cs`, `SkippedQuestionTrailEntry.cs`
- `DraftRequestDocument.TransparencyTrail`, `ArchitectureRequest.IntakeTransparencyTrail`, `FeasibilityVerdict.TransparencyTrail`
- `archlucid-ui/src/components/feasibility/TransparencyTrailPanel.tsx` — **reuse; do not fork**
- `archlucid-ui/src/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailFeasibilityVerdictSection.tsx`
- Review Overview / Finalized review record tabs (`review-detail-workspace-tabs.ts`)
- Provenance / claim-labeling (SAQ-011, TB-034) — compose, do not fork a new store

## What to build

1. Mount existing `TransparencyTrailPanel` on review **Overview** and on the draft/pre-finalize surface when a trail exists. Working mode: expanded. Guided: available, not buried only in technical appendix.
2. If the API omits the trail on a **completed** review, show the existing `missingTrailDefect` callout (“transparency record missing”). Do not fake rows.
3. Skipped MUST questions: visible **before finalize** when the trail exists (panel or a compact MUST-only strip next to Finalize).
4. Include the trail in existing export/package generation paths if those already serialize JSON/Markdown — add a section, do not invent a second PDF stack.
5. Feasibility verdict (`Feasible | SoftInfeasible | HardInfeasible`) if already on the payload: keep current ADR 0050 rendering. If not wired in the pipeline yet, render the trail only and do not invent verdicts.
6. Vitest for Overview mapping (including skipped MUST and missing-trail defect). Scoped compile only if you consume new DTO fields.

## Acceptance criteria

- An architect can answer “what did I assert vs what did ArchLucid fill?” from Overview without opening diagnostics or the sealed-record appendix.
- Skipped MUST questions are visible before finalize when the trail exists.
- Missing trail on a completed review is a visible defect, not a quiet absence.
- No duplicate provenance store; `TransparencyTrailPanel` remains the one UI.

## Constraints

- Do not claim Hard infeasible without a citation.
- Do not silently relax invariants in the UI.
- Tenant isolation unchanged; trail may contain user text — keep it in-tenant.
