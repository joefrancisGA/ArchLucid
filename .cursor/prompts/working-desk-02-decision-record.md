# WD-02 — Decision record is the work, not an appendix

**Do not fork PT-08 / PT-16 / PT-17.** If those are unstarted, run them first: trail on Overview, infeasible-as-package, skipped MUST on the finalize scorecard. This file is only the **desk + export** residual.

## Goal

Before **Finalize**, a Working-mode architect can answer “what did I assert, what did ArchLucid fill, which MUST questions did I skip?” from Overview and from the finalize control itself. A skipped MUST is **loud**. A completed review with no trail is a **defect callout**, not a quiet absence. Reuse `TransparencyTrailPanel`.

## Why

ADR 0050 and debate R4: “if ArchLucid got it wrong, the user got it wrong” is only fair when the transparency trail is a **mandatory output**. Livelihood risk is defending a sealed package in a review board. `RunDetailOverviewTransparencyTrail` already mounts the panel on Overview / create-home. That is not enough if skipped MUST is not next to Finalize, if the trail is empty until the feasibility section, or if export packets omit it.

Career risk without that record is the product transferring liability to the human.

## Context

- ADR 0050: `docs/architecture/adrs/0050-feasibility-classification-transparency-trail.md`
- `docs/ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md` R4 / R5
- `archlucid-ui/src/components/feasibility/TransparencyTrailPanel.tsx` — **reuse; do not fork**
- `archlucid-ui/src/components/reviews/RunDetailOverviewTransparencyTrail.tsx`
- `archlucid-ui/src/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailFeasibilityVerdictSection.tsx`
- Finalize CTA / review-package tab (`review-detail-workspace-tabs.ts` id `review-package`)
- Contracts: `AssertedTrailEntry`, `InferredTrailEntry`, `SkippedQuestionTrailEntry`; `DraftRequestDocument.TransparencyTrail`
- PT-08 Overview mount; PT-16 infeasible hierarchy; PT-17 MUST scorecard block — **do not re-implement those gates**

## What to build

1. Working mode: trail **expanded** on Overview when present. Guided: available, not only in a technical appendix.
2. Skipped MUST **strip next to Finalize** for Working (visible list). Blocking belongs to PT-17 — if PT-17 has landed, do not add a second gate; if it has not, do not invent a parallel scorecard here (run PT-17).
3. Completed review with omitted trail: existing `missingTrailDefect` copy. Do not fake rows.
4. If package Markdown/JSON export already serializes sections, add a Transparency trail section. Do not invent a second PDF stack.
5. Hard vs soft: keep ADR 0050 rendering if verdict is on the payload. Do not invent `HardInfeasible` without a citation.
6. Vitest: Overview mapping, skipped MUST before finalize, missing-trail defect. Scoped compile only if new DTO fields.

## Acceptance criteria

- Architect can answer asserted vs inferred from Overview without opening diagnostics.
- Skipped MUST questions are visible on the finalize path when the trail exists.
- Missing trail on a completed review is a visible defect.
- One UI: `TransparencyTrailPanel`.

## Constraints

- Do not claim Hard infeasible without a citation.
- Do not silently relax invariants in the UI.
- Tenant isolation unchanged; trail may contain user text — keep it in-tenant.
- Do not change `typed-engine-protected`.
