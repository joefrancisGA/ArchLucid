> **Scope:** Contributor-reference — TB-956 co-commit governance disposition rows with Required audit events (INV-003 mitigation).

**Audience:** Contributors and internal assurance reviewers.

# Same-transaction governance audit writes

**Last updated:** 2026-09-08

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

## In scope

| Path | Domain write | Required audit | Co-commit |
|------|--------------|----------------|-----------|
| Approve | `TryTransitionFromReviewableAsync` → Approved | `GovernanceApprovalApproved` | Yes (SQL UoW) — **TB-956** |
| Reject | `TryTransitionFromReviewableAsync` → Rejected | `GovernanceApprovalRejected` | Yes (SQL UoW) — **TB-956** |
| Submit | `GovernanceApprovalRequests` create | `GovernanceApprovalSubmitted` | Yes (SQL UoW) — **ADR 0083 / LP-09** |
| Promote | `GovernancePromotionRecords` create (+ optional approval → Promoted) | `GovernanceManifestPromoted` | Yes (SQL UoW) — **ADR 0083 / LP-09** |
| Activate | `GovernanceEnvironmentActivations` create | `GovernanceEnvironmentActivated` | Yes (SQL UoW) — **ADR 0083 / LP-09** |

## Out of scope (unchanged)

- Risk waiver create/revoke (**TB-956** wave 2)
- Informational audit (**TB-001**) — remains best-effort `TryLogAsync`
- Baseline mutation audit rows — informational companion; recorded after successful UoW commit

## ADR 0083 reference

Contract: [`0083-promote-activate-submit-same-tx-audit.md`](../architecture/adrs/0083-promote-activate-submit-same-tx-audit.md). **Do not** weaken approve/reject co-commit from **TB-956**.

## In-memory / test path

When `IArchLucidUnitOfWork.SupportsExternalTransaction` is false, approve/reject and submit/promote/activate retain sequential transition-then-audit behavior (unit tests with in-memory repos).

## Verification

- Unit: `GovernanceWorkflowServiceSameTxAuditTests` — mocks SQL UoW; asserts `LogAsync(event, uow)` before `CommitAsync`; rollback on audit failure
- Contract: existing parallel transition tests unchanged
- Orphan probe **TB-955**: should not fire for new approve/reject/submit/promote/activate rows after co-commit ships

## Residual dual-write

Operator disposition and waiver paths remain sequential until **TB-956** wave 2. Monitoring and fail-closed behavior from **TB-953**/**TB-955** still apply to out-of-scope paths.
