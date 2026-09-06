# DR-06 — Crash or lost lease cannot remain In progress

**Do not fork PC-08** background-wait copy. **Do not fork** in-flight strip chrome. Execute the **TB-943** leftover named in `CRASH_RECOVERY_LONG_RUNNING_REVIEW_CLAIM_MAP.md`.

## Goal

If the execute worker dies after partial `AgentResults` persist, the run must not stay **In progress** indefinitely. Implement (or finish) an execute **ownership lease**: expired lease → terminal `Failed` or `PartiallyCompleted` with a visible reason, plus the DR-02/DR-03 band for what did not finish.

Working reviews hub and review-detail badges must match the terminal status (no “In progress” snapshot flag after lease expiry).

Keep “you can leave this page — analysis continues on the server” for **healthy** leases only.

## Why

A livelihood tool cannot tell an architect the review is still running when no worker holds the lease. Partial findings plus a green spinner is a silent drop.

## Context

- `docs/library/CRASH_RECOVERY_LONG_RUNNING_REVIEW_CLAIM_MAP.md` (TB-1523 / TB-943)
- `AgentExecuteIdempotentResultPolicy.cs` (rebill-on-retry after LLM spend — document residual, do not pretend provider-idempotent)
- `ReviewsHubInFlightAnalysisDesk.tsx` / run status badges
- Terraform/host: lease storage must be SQL in the tenant database’s single DDL file + numbered migration, not a new undocumented store

## What to build

1. Lease column/table in the existing tenant SQL DDL + DbUp migration.
2. Worker heartbeat; expiry job or request-path reconcile.
3. API status + UI copy: PartiallyCompleted / Failed with “worker lost — reopen or retry execute.”
4. Tests: kill-lease fixture → not In progress; healthy heartbeat stays in-flight.

## Acceptance criteria

- After lease expiry, no Working surface says the review is still running.
- Retry still uses existing idempotent persist policy; residual rebill is documented in the runbook, not hidden.

## Constraints

- ADR 0037 tenant isolation. Infra/keys in Terraform if any new secret. No table merge.
