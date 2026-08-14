> **Scope:** TB-956 — co-commit governance disposition rows with Required audit events (INV-003 mitigation).

# Same-transaction governance audit writes

**Last updated:** 2026-08-14

## Problem

**TB-953** fail-closed (`LogOrThrowAsync`) stops silent audit loss but still allowed **domain committed, audit failed → HTTP 500** when `TryTransitionFromReviewableAsync` opened its own Serializable transaction and committed before the Required audit insert ran.

## Decision

Use **same SQL transaction** for the hottest governance paths first:

1. `GovernanceApprovalRequests` status transition (approve / reject)
2. Required durable audit row (`GovernanceApprovalApproved` / `GovernanceApprovalRejected`)

Infrastructure already exists:

- `IAuditService.LogAsync(AuditEvent, IArchLucidUnitOfWork, CancellationToken)`
- `DapperAuditRepository.AppendAsync(..., IDbConnection, IDbTransaction)`
- `IGovernanceApprovalRequestRepository.TryTransitionFromReviewableAsync(..., connection, transaction)` (**TB-956**)

Transactional **audit outbox** is deferred — not needed while `AppendAsync` supports enlistment.

## In scope (shipped TB-956)

| Path | Domain write | Required audit | Co-commit |
|------|--------------|----------------|-----------|
| Approve | `TryTransitionFromReviewableAsync` → Approved | `GovernanceApprovalApproved` | Yes (SQL UoW) |
| Reject | `TryTransitionFromReviewableAsync` → Rejected | `GovernanceApprovalRejected` | Yes (SQL UoW) |

## Out of scope (this batch)

- Promote / activate / submit (still post-commit Required audit — orphan probe **TB-955** covers)
- Risk waiver create/revoke (**TB-956** wave 2)
- Informational audit (**TB-001**) — remains best-effort `TryLogAsync`
- Baseline mutation audit rows — informational companion; recorded after successful UoW commit

## In-memory / test path

When `IArchLucidUnitOfWork.SupportsExternalTransaction` is false, approve/reject retain sequential transition-then-audit behavior (unit tests with in-memory repos).

## Verification

- Unit: `GovernanceWorkflowServiceSameTxAuditTests` — mocks SQL UoW; asserts `LogAsync(event, uow)` before `CommitAsync`; rollback on audit failure
- Contract: existing parallel transition tests unchanged
- Orphan probe **TB-955**: should not fire for new approve/reject rows after co-commit ships

## Residual dual-write

Promote, activate, operator disposition, and waiver paths remain sequential until a follow-on batch. Monitoring and fail-closed behavior from **TB-953**/**TB-955** still apply.
