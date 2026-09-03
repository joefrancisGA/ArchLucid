# WD-04 — Amend livelihood-grade writes (history plus correction)

**Do not fork PT-05.** If amend/confirm-copy work is unstarted, run `professional-tool-05-durable-amend.md`. This file is the residual: wire the control the copy already promises, and make registry classification match the dialog.

## Goal

Mistaken approve / reject / promote / activate / archive / quick-approve are **amendable** as a new audit event, or the confirm copy truthfully says there is no in-product correction and names the trail / support path. Finding dispositions keep the several-minute undo. Sealed manifests stay immutable.

## Why

All-day users fat-finger. Confirm dialogs are a consumer pattern. `MUTATION_REVERSIBILITY_REGISTRY` still marks `governance_quick_approve` and `governance_policy_pack_publish` as `permanent`. Quick-approve copy already says “record a correction there” without wiring a control. A livelihood tool keeps **history plus correction**, not confirm-then-forever.

## Context

- `archlucid-ui/src/lib/mutation-reversibility-registry.ts`
- `archlucid-ui/src/components/operator/ReversibleMutationSuccessCallout.tsx`
- Governance approve / reject / promote / activate flows (grep `governance_workflow_` / `governance_quick_approve`)
- `FindingInspectDispositionForm.tsx`, `GovernanceFindingsBulkActions.tsx`
- Confirm copy: `review-archive-confirm-copy.ts`, policy-pack publish confirms
- PT-05 residual: this prompt **wires Amend** and makes confirm copy match the registry

## What to build

1. Finding dispositions: keep 300s undo and 24-hour deferred revisit. Add visible **Amend disposition** that writes a new rationale; do not delete the original audit row.
2. For each `permanent` registry id:
   - If product-legal: **Record correction** control → new audit event, prior state remains on the evidence trail.
   - If not (e.g. pack publish): confirm copy names that fact and the audit/support path. Do not say “cannot be undone” if an amend path exists, and do not say “record a correction there” if no control exists.
3. `governance_quick_approve`: wire the correction control the copy already promises, or change the copy.
4. Do not add a second draft store for Ctrl+Z if it fights autosave. Optional in-field undo only if cheap.
5. Vitest: registry vs rendered confirm copy; amend creates a second event; original remains. Scoped compile if C# audit APIs change. All SQL DDL in the single database file.

## Acceptance criteria

- Mistaken Alt+1 remains recoverable after >10 seconds (do not regress).
- Mistaken approve/reject can be amended **or** the dialog is honest about terminal + named path.
- Amendments appear on the evidence/audit trail; they do not erase the original.
- Desktop review tabs are not collapsed to “make governance simpler.”

## Constraints

- Tenant isolation on any new mutation API.
- One class per file; no `ConfigureAwait(false)` in tests.
- Do not weaken sealed-manifest immutability; amend is a new event.
- Do not shorten `MUTATION_UNDO_WINDOW_SECONDS`.
