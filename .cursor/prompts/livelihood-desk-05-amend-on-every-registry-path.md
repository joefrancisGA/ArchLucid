# LD-05 — Record correction is mounted on every livelihood write

**Do not fork LI-05, PT-05, or WD-04.** Finding undo stays 300s. `POST /v1/governance/mutation-corrections` and `GovernanceRecordCorrectionDialog` already exist. This file is **registry vs mounted control**.

## Goal

Every `MUTATION_REVERSIBILITY_REGISTRY` id that is `amendable: true` has a visible **Record correction** control on the success path the architect actually uses (quick-approve, workflow approve/reject/promote/activate, bulk, keyboard). Permanent ids (pack publish) keep honest confirm copy and **no** fake amend control. Sealed manifests stay immutable. `MUTATION_UNDO_WINDOW_SECONDS` stays 300.

## Why

All-day users fat-finger. Confirm-then-forever is casual-app design. LI-05 wired the API and some buttons. Grep still needs to prove every amendable registry id has a mounted control, and that keyboard/bulk paths are not confirm-then-forever. Copy that says “use Record correction” without a control is a lie.

## Context

- `archlucid-ui/src/lib/mutation-reversibility-registry.ts`
- `archlucid-ui/src/components/governance/GovernanceRecordCorrectionDialog.tsx`
- `archlucid-ui/src/components/governance/GovernanceRecordCorrectionInlineControl.tsx`
- `archlucid-ui/src/components/operator/ReversibleMutationSuccessCallout.tsx`
- Grep `governance_quick_approve` / `governance_workflow_*` / `governance_bulk_disposition` / `governance_keyboard_finding_disposition`
- `FindingInspectDispositionForm.tsx`, `GovernanceFindingsBulkActions.tsx`
- Confirm copy: `review-archive-confirm-copy.ts`, policy-pack publish confirms
- `ArchLucid.Application` `GovernanceMutationCorrectionService`

## What to build

1. Inventory: for each registry id, list the UI success surfaces. Amendable → `GovernanceRecordCorrectionInlineControl` (or equivalent) after confirm. Permanent → confirm copy names audit/support path; **no** Record correction button.
2. Keyboard finding disposition and bulk disposition: after the 300s undo window, Amend is still available as a new audit event (LI-05 contract). Do not delete the original row.
3. Archive (if still one-way): either amendable + control, or honest terminal copy. Do not say “cannot be undone” if an amend path exists.
4. Pack publish stays permanent. Do not add a fake unpublish.
5. Vitest: registry id × mounted control table; amend creates a second event; original remains. Scoped compile only if C# audit APIs change. All SQL DDL in the single database file.

## Acceptance criteria

- Mistaken Alt+1 remains recoverable after >10 seconds (do not regress).
- Every amendable registry id has a Record correction control on its primary success path.
- Permanent publish copy is honest and has no fake amend control.
- Amendments appear on the evidence/audit trail; they do not erase the original.

## Constraints

- Tenant isolation on the existing mutation API — do not add a second correction store.
- One class per file; no `ConfigureAwait(false)` in tests.
- Do not weaken sealed-manifest immutability; amend is a new event.
- Do not shorten `MUTATION_UNDO_WINDOW_SECONDS`.
