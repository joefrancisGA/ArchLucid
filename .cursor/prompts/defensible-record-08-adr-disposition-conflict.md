# DR-08 — ADR 0076: concurrent finding dispositions conflict

**Do not lengthen** `MUTATION_UNDO_WINDOW_SECONDS`. **Do not fork PC-10** grid amend — this is concurrency, not toast UX. Confirm next ADR number (**0076** if 0075 exists).

## Goal

Write **ADR 0076** superseding the V1 “both writes succeed, current = latest timestamp” choice in `FINDING_CONCURRENT_DISPOSITION_CONFLICT_CONTRACT.md` (TB-986) **for Working**. Second writer gets **409** (or equivalent) with the first writer’s disposition visible; the loser uses Record correction (existing) rather than silently flipping current.

Governance approval already uses CAS — align the mental model.

Do **not** introduce a mutex that can deadlock execute. Optimistic version / `ROWVERSION` on the current disposition pointer is enough.

## Why

Two architects in a room (R4) must not both think they accepted finding 47. Last-timestamp-wins is a casual multiplayer default.

## Context

- `FINDING_CONCURRENT_DISPOSITION_CONFLICT_CONTRACT.md`
- `FindingDispositionService` / `GovernanceMutationCorrectionService`
- Run header already uses `ROWVERSION` (`DATA_CONSISTENCY_MATRIX.md`)
- `mutation-reversibility-registry.ts` — keep 300s undo for the winner

## What to build

1. ADR 0076 + contract doc update (“Today” vs Working target). Do not rewrite TB-986 history; supersede.
2. API 409 payload: current disposition, actor, timestamp.
3. Working UI: conflict dialog on the row (PC-10 mount) — reload current, then amend if needed.
4. Tests: two concurrent accepts → one 409; Guided may keep documented V1 race if fixtures require it — say so in Trade-offs.

## Acceptance criteria

- Working cannot store two “current” dispositions for one finding.
- Sealed trail stays append-only; 409 is on the *current pointer*, not deleting history.

## Constraints

- No finding-comment chat. No unseal. TB-645.
