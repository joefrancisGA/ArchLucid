# PC-10 — Amend on the grid without the undo toast window

**Do not fork CD-10 / WA-11** — extend mounts. **Do not lengthen** `MUTATION_UNDO_WINDOW_SECONDS`. **Do not use** `window.confirm` as the only amend path.

## Goal

On Working **findings list** and **governance queue** (and review-detail findings tab list mode):

1. **Record correction** / **Amend disposition** visible on the row when `amendable: true` in mutation registry — **without** opening inspect and **without** waiting for the 300s `ReversibleMutationSuccessCallout` to expire.
2. Permanent mutations show disabled correction with honest sealed reason (existing copy).
3. Bulk disposition rows: same amend affordance per row after bulk success.

## Why

Five-minute undo is a casual-SPA pattern. In a one-hour meeting, the architect needs **audit-shaped amend** immediately, not a toast countdown.

## Context

- `FindingDispositionRecordCorrectionControl.tsx`
- `ReversibleMutationSuccessCallout.tsx`, `mutation-reversibility-registry.ts`
- `career-desk-10-amend-after-undo-remaining-writes.md`
- Governance list/grid components

## What to build

1. Mount correction control on list rows where registry says amendable.
2. Ensure API amend path works from list context (same as inspect).
3. Vitest: after disposition, row shows Record correction immediately; undo toast may still show in parallel.

## Acceptance criteria

- No regression on 300s undo for reversible dispositions.
- Guided may hide list amend until Execute+ rank (existing gate).

## Constraints

- Sealed manifests stay immutable.
