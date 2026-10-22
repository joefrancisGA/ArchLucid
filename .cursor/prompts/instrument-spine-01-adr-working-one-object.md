# IS-01 — ADR 0069: Working desk is one work object

**Do not rewrite ADR 0067.** Create architecture and Review remain co-equal *jobs* for Guided / buyer-eval. **Do not rewrite ADR 0068.** Synthesis and review stay two kernels; this ADR is *desk identity*, not kernel merge. **Do not fork CD-03** for §6 emphasis tests — that file kept 0067. This file **supersedes 0067 for Working only**.

## Goal

Write **ADR 0069** (next free number after 0068): on an authenticated **Working** seat, ArchLucid presents **one resumable work object** whose durable outcome is a sealed review record. Create-architecture is how that object is born or revised (new version / clone-from-snapshot), not a peer product. Guided / demo / trial keep ADR 0067 peer entry points. Artifacts stay unequal (draft ≠ sealed record). Do not merge `DraftRequests` and `Runs`.

## Why

ADR 0067 rejected “single Start review, draft is Resume” as a *product* ranking. The livelihood diagnosis is that the **paying desk** cannot ask a repeat professional to self-classify into two start products before they have a vocabulary. Those are compatible if Working uses one object and Guided keeps two doors.

R13 / ADR 0052 license a seat for the expert hub, not a first-session funnel. Two peer CTAs are an evaluator pattern.

## Context

- `docs/architecture/adrs/0067-create-architecture-and-review-co-equal-entry-points.md` — keep Accepted; add a “Superseded for Working by 0069” note only if the ADR process allows a *pointer* in Consequences — prefer a one-line Related on 0069 instead of editing 0067 body
- `docs/architecture/adrs/0068-architecture-synthesis-and-review-evaluation-kernels.md` — kernels stay
- `docs/architecture/adrs/README.md` + `template.md` (Trade-offs, Constraints, Expected impact are merge-blocking)
- `docs/ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md` R13
- `archlucid-ui/src/lib/buyer/create-review-peer-parity.test.tsx`
- `WORKING_NEW_REVIEW_LABEL` / `WORKING_MODE_NEW_REVIEW_ROUTE`

## What to build

1. New file `docs/architecture/adrs/0069-working-desk-one-work-object.md` with required sections. Status **Proposed** is enough for this prompt; later IS-02/03 may land as Accepted in the same PR if the owner prefers one merge.
2. Decision points (must be falsifiable):
   - Working: one primary from workspace state (resume last draft/review, else new work into the draft editor). Both *capabilities* remain reachable (drafts list, packages list) without two competing primaries on one hub.
   - Guided / demo / trial: ADR 0067 unchanged (no Step 1/Step 2; equal weight when both appear).
   - ADR 0068 kernels unchanged. Spawn lock unchanged. Sealed records stay immutable.
3. Row in `docs/architecture/adrs/README.md`.
4. A guard test or comment in the peer-parity test file pointing at 0069 for Working fixtures — **do not flip Working chrome in this prompt** unless the ADR cannot be reviewed without a failing test. Prefer ADR + README only if chrome is IS-02.

## Acceptance criteria

- ADR 0067 file body is not rewritten (immutability).
- ADR 0068 is not rewritten.
- A reviewer can quote 0069 to refuse two peer start products on Working Home.
- Guided still legally has two jobs of equal standing.
- Draft is never called a sealed record.

## Constraints

- TB-1539 / TB-1544 single-primary-per-hub stays.
- Do not collapse desktop review tabs.
- Do not implement **M-44**.
- Do not merge database objects.
