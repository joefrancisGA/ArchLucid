# DR-07 — ADR 0075: coordinator audit echo fail-closed

**Do not rewrite** ADR 0039 / sealed evidence DENY. **Do not drop** the dual-channel baseline mutation log. Next free ADR number after **0074** is **0075** (confirm `docs/architecture/adrs/README.md` before writing).

## Goal

Write **ADR 0075**: when the durable `dbo.AuditEvents` append for a coordinator/orchestration echo fails after retries, Working **governed** mutations (finalize, finding disposition, governance approve) must **not** report success as if the ledger wrote.

Today orchestration can complete while `archlucid_audit_write_failures_total` is the only signal (`AUDIT_COVERAGE_MATRIX.md`). That is fail-open for a career record.

Pick one decision in Trade-offs (do not implement both):

1. **Fail the user mutation** (preferred for finalize / disposition / approve), or
2. **Succeed the mutation and persist a user-visible Failed audit receipt** on the run that blocks career export until reconciled.

Status Proposed is enough if the product PR lands Accepted in the same change.

## Why

Livelihoods depend on the audit trail matching what the architect thinks they signed. Swallowed echo is a casual SPA.

## Context

- `docs/library/AUDIT_COVERAGE_MATRIX.md` coordinator echo notes
- `LAYERED_AUDIT_ENFORCEMENT.md`
- `AUDIT_EVENT_MODEL.md`
- `docs/architecture/adrs/template.md` — Trade-offs, Constraints, Expected impact are merge-blocking

## What to build

1. ADR 0075 + README row.
2. Product: stop swallowing the echo on the Working governed paths named in the ADR (one class per file).
3. Tests: simulated audit append failure → no silent success (user error or blocking receipt).
4. Metric may remain; it is not a substitute for the user-visible outcome.

## Acceptance criteria

- A reviewer can quote 0075 to refuse “best-effort audit.”
- Baseline channel stays non-queryable via `/v1/audit` unless you explicitly expand that (out of scope).

## Constraints

- Dev `dbo` skip-DENY stays a documented residual. No per-architecture ACL.
