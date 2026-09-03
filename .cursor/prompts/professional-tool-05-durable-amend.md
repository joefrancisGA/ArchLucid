# PT-05 — Durable amend for livelihood-grade actions

## Goal

Professionals can reverse or **amend** livelihood-grade actions without racing a toast. Finding dispositions already have a several-minute undo — keep it. Actions that must stay immutable get an **amendment** that writes a new audit event instead of pretending the first click is forever after a confirm dialog.

## Why

`MUTATION_UNDO_WINDOW_SECONDS = 300` and the 24-hour deferred revisit already shipped for finding dispositions (`mutation-reversibility-registry.ts`). Do **not** revert that to 10 seconds. Approve / reject / promote / activate / archive are still **`permanent`** with copy like “cannot be undone from this workspace.” All-day users fat-finger. Excel/VS Code keep undo; a governance tool should keep **history plus correction**.

## Context

- `archlucid-ui/src/lib/mutation-reversibility-registry.ts`
- `archlucid-ui/src/components/operator/ReversibleMutationSuccessCallout.tsx`
- `archlucid-ui/src/components/usability/GovernanceFindingsBulkActions.tsx`
- Finding keyboard triage (`useFindingCardShortcuts.ts`, `FindingKeyboardTriageHost.tsx`)
- Confirm copy: `architecture-draft-delete-copy.ts`, `review-archive-confirm-copy.ts`
- Finding inspect disposition form (`FindingInspectDispositionForm.tsx`)

## What to build

1. **Finding dispositions (already reversible)**
   - Keep the several-minute in-session Undo and the 24-hour deferred revisit.
   - Add a visible **Amend disposition** on the finding row/detail that records a new rationale (do not delete the original audit row).
2. **Currently permanent governance writes** (approve / reject / promote / activate / archive)
   - Do **not** silently make sealed records mutable.
   - Add an **Amend** or **Record correction** action where product-legal: new audit event, prior state remains visible on the evidence trail.
   - If a write truly cannot be amended in V1 (e.g. package publish), say so in the confirm copy and point to the audit trail — do not claim “cannot be undone” if an amend path exists.
   - `governance_quick_approve` copy already mentions recording a correction — wire the control if it is missing.
3. Draft editor: if a local undo stack is cheap (architecture draft fields), add Ctrl/Cmd+Z for in-field/draft document undo without touching server history. Skip if it would fight autosave; do not invent a second draft store.
4. Vitest for registry classifications, callout visibility, bulk undo, and amend copy. Scoped compile if C# audit APIs change.

## Acceptance criteria

- A mistaken Alt+1 on a finding is recoverable after more than 10 seconds without hunting a deferred queue (already true — do not regress).
- A mistaken approve/reject can be **amended** as a new audit event, or the confirm copy truthfully says there is no in-product correction and names the audit trail / support path.
- Amendments appear on the evidence/audit trail; they do not erase the original event.
- Confirm dialogs tell the truth: reversible, amendable, or truly terminal.

## Constraints

- Tenant isolation on any new mutation API.
- One class per file; all SQL DDL in the single database file if schema changes.
- Do not use `ConfigureAwait(false)` in tests.
- Do not weaken sealed-manifest immutability; amend is a new event.
- Do not shorten `MUTATION_UNDO_WINDOW_SECONDS`.
