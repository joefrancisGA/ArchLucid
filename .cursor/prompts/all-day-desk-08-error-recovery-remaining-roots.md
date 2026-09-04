# AD-08 — Remaining high-stakes failures use the TB-2155 recovery contract

**Do not fork TB-2155 golden-path wiring.** `OperatorErrorRecoveryContract` is already required on review-package load, `OperatorApiProblem`, layered connectivity, and `OperatorMutationInlineError`. This file is the leftover **inventory expansion**: finding inspect load/mutation, shell in-flight cancel failure, and other livelihood writes that still toast-only or render a single `<p role="alert">`.

## Goal

Add named roots to `ERROR_RECOVERY_CONTRACT_GUARDED_SURFACES` for: finding inspect load failure, in-flight cancel **system** failure (after AD-02 confirm), and any remaining architecture-draft **save** conflict that is not already on `OperatorMutationInlineError`. Each root shows What failed / What’s intact / Next step. Do not toast client-known validation (TB-2005).

## Why

Professionals self-rescue before Report Problem. Casual tools toast and leave. Golden-path only covers package load and generic API problem — not the inspect desk or the header cancel path.

## Context

- `archlucid-ui/src/lib/error-recovery-contract-inventory.ts`
- `archlucid-ui/src/lib/error-recovery-contract-copy.ts`
- `archlucid-ui/src/components/usability/OperatorErrorRecoveryContract.tsx`
- `error-recovery-contract-guard.test.ts`
- AD-02 cancel confirm — this prompt owns **failed** cancel recovery, not the confirm itself
- AD-11 owns **draft load** specifically — skip draft load here if you split; include only if AD-11 is not run in the same session

## What to build

1. Grep finding inspect and `ShellInFlightOperationsAffordance` for `showError` / bare `role="alert"` on **load/mutation/cancel** failures.
2. Route those through `OperatorErrorRecoveryContract` or `OperatorMutationInlineError` (already a guarded root — prefer reuse).
3. Extend the Vitest inventory with the new source roots.
4. Vitest: inventory fails if a newly listed root drops the markers; cancel failure after confirm is not toast-only if you take that root.

## Acceptance criteria

- A failed inspect load or cancel explains what is intact (the running pipeline / the last saved disposition) and one next step.
- Report Problem / correlation ids remain for escalation, not the only copy.
- Existing four golden-path roots still pass the guard.

## Constraints

- Do not toast client-known empty rationale (TB-2005).
- Do not implement AD-11 draft-load in this file if you are also running AD-11 — pick one owner.
- Do not collapse review tabs.
