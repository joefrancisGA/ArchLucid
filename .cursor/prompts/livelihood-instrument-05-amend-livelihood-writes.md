# LI-05 — Amend livelihood-grade writes (history plus correction)

**Do not fork PT-05 or WD-04.** Finding dispositions already have a several-minute undo — **keep it**. This file **wires the control the copy already promises**.

## Goal

Mistaken approve / reject / promote / activate / archive / quick-approve are **amendable** as a new audit event, or the confirm copy truthfully says there is no in-product correction and names the trail / support path. Sealed manifests stay immutable. `MUTATION_UNDO_WINDOW_SECONDS` stays 300.

## Why

All-day users fat-finger. Confirm-then-forever is casual-app design. `MUTATION_REVERSIBILITY_REGISTRY` still marks `governance_quick_approve` and `governance_policy_pack_publish` as `permanent`. Quick-approve copy already says “record a correction there if approval was mistaken” **without a control**. Either wire Amend or stop lying in the dialog.

## Context

- `archlucid-ui/src/lib/mutation-reversibility-registry.ts`
- `archlucid-ui/src/components/operator/ReversibleMutationSuccessCallout.tsx`
- Grep `governance_quick_approve` / `governance_workflow_approve` / `governance_policy_pack_publish`
- `FindingInspectDispositionForm.tsx`, `GovernanceFindingsBulkActions.tsx`
- Confirm copy: `review-archive-confirm-copy.ts`, policy-pack publish confirms

## What to build

1. Finding dispositions: keep 300s undo and 24-hour deferred revisit. Add visible **Amend disposition** that writes a new rationale; do not delete the original audit row.
2. For each `permanent` registry id:
   - If product-legal: **Record correction** → new audit event, prior state remains on the evidence trail.
   - If not (pack publish): confirm copy names that fact and the audit/support path. Do not say “cannot be undone” if an amend path exists, and do not say “record a correction there” if no control exists.
3. `governance_quick_approve`: wire the correction control the copy already promises, or change the copy **and** the registry note in the same change.
4. Optional in-field Ctrl/Cmd+Z on draft fields only if cheap and it does not fight autosave. Skip a second draft store.
5. Vitest: registry vs rendered confirm copy; amend creates a second event; original remains. Scoped compile if C# audit APIs change. All SQL DDL in the single database file.

## Acceptance criteria

- Mistaken Alt+1 remains recoverable after >10 seconds (do not regress).
- Mistaken approve/reject can be amended **or** the dialog is honest about terminal + named path.
- Amendments appear on the evidence/audit trail; they do not erase the original.
- Desktop review tabs are not collapsed.

## Constraints

- Tenant isolation on any new mutation API.
- One class per file; no `ConfigureAwait(false)` in tests.
- Do not weaken sealed-manifest immutability; amend is a new event.
- Do not shorten `MUTATION_UNDO_WINDOW_SECONDS`.
