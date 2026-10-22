# LS-06 — What-if execute from this review (R12)

**Do not fork WA-20, RS-08, PT-20, or IS-03.** Those shipped Compare prefill and an **honest subset** (copy that a true branch is a new review from snapshot). Owner authorization for this wave: implement the **ceteris-paribus execute**, not another copy paragraph.

## Goal

From a committed Working review, the architect can start a **what-if**: clone from snapshot (WA-10 path), override **one** invariant, execute as a new review, then Compare(base, branch). Surface **cost** before execute (R12 constraint 2). Do not fake an in-place slider that does not run the pipeline. Guided may hide the control.

## Why

R12 is the envelope: at 3s vs 5s. Livelihoods run trade-offs from the document. “Leave and type two ids” or “clone then remember to change one field” is evaluator homework. The founding contract already rejected a draft-diff engine; reuse Compare unchanged.

## Context

- `docs/ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md` R12
- `ArchitectureDraftCloneSnapshotControl.tsx` / spawn lock
- `AuthorityCompareService` / Compare UI
- `LONG_RUNNING_OPERATIONS_CONTRACT.md` — no fake progress %
- IS-09 wait-is-background — the branch run must not trap the architect on one tab
- Billing / wallet if runs are billable — do not hide GPU/run cost

## What to build

1. Working review action **What-if** (not a second Compare). Wizard: pick one invariant/field already on the sealed/committed package → confirm cost → clone+override+execute.
2. MUST-set / admission gate still applies to the branch (R12 constraint 1). Refuse to execute a half-elicited draft as Compare input.
3. On complete, open Compare(base, branch) with both ids filled. Assumptions-delta already exists (WA-09) — do not rebuild Compare.
4. Cap or confirm cost; reuse existing run-cost / wallet warnings if present.
5. Vitest + scoped API tests: override exactly one field in the spawned request; two-field attempt is invalid; Guided does not show the control by default.

## Acceptance criteria

- A Working architect can produce a comparable branch without a blank Compare form.
- Cost is visible before execute.
- Sealed base is not mutated. Branch is a new review.
- Desktop tabs unchanged.

## Constraints

- Do not merge draft and review tables.
- Do not silently relax invariants (R5: human disposes).
- Do not implement live occupancy.
- Terraform/billing: if a new meter is required it must be representable in existing IaC modules — do not invent a side channel.
