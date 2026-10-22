> **Scope:** ADR 0083 — Promote / activate / submit Required durable audit co-commits with domain writes (livelihood-proof LP-08 / TB-956 wave 2).

> **Spine doc:** [`START_HERE.md`](../../START_HERE.md).

# ADR 0083: Promote / activate / submit same-transaction Required audit

- **Status:** Proposed
- **Date:** 2026-09-08
- **Owner decision:** Extend TB-956 same-SQL-UoW co-commit from approve/reject to production-change paths — submit, promote, and activate (LP-08 / wave 20)

## Context

ArchLucid's governance workflow records **Required** durable audit events for every production-touching transition (`RequiredAuditEventTypes` in `ArchLucid.Core.Audit`). **TB-953** fail-closed (`LogOrThrowAsync`) stops silent audit loss, but **post-commit** Required audit still allows **domain committed, audit failed → HTTP 500** — an orphan the buyer sees as "promote succeeded but audit is missing."

**TB-956 (shipped)** fixed the signature moment: approve and reject co-commit `GovernanceApprovalRequests` status transition with `GovernanceApprovalApproved` / `GovernanceApprovalRejected` in one SQL unit of work via `IAuditService.LogAsync(AuditEvent, IArchLucidUnitOfWork, CancellationToken)` and repository enlistment (`TryTransitionFromReviewableAsync(..., connection, transaction)`). See [`SAME_TX_GOVERNANCE_AUDIT_DESIGN.md`](../../library/SAME_TX_GOVERNANCE_AUDIT_DESIGN.md).

**Production-change paths remain sequential** (domain `CommitAsync` first, Required audit `LogGovernanceDurableWithRetryAsync` after):

| Path | Domain write | Required audit | Co-commit today |
|------|--------------|----------------|-----------------|
| Submit | `GovernanceApprovalRequests` create | `GovernanceApprovalSubmitted` | **No** |
| Promote | `GovernancePromotionRecords` create (+ optional approval status → Promoted) | `GovernanceManifestPromoted` | **No** |
| Activate | `GovernanceEnvironmentActivations` create | `GovernanceEnvironmentActivated` | **No** |
| Approve / reject (TB-956) | `TryTransitionFromReviewableAsync` | `GovernanceApprovalApproved` / `GovernanceApprovalRejected` | **Yes** |

Livelihood defense is weaker on the **hotter path**: promote and activate are when production actually changes; submit starts the approval chain that gates those transitions. Orphan probe **TB-955** detects mismatches but does not prevent them.

**Related (not rewritten):** ADR 0037 (tenant isolation), ADR 0039 (sealed immutability), ADR 0075 (coordinator audit echo fail-closed), ADR 0076 (disposition 409), ADR 0082 (decision-grade provenance — separate concern), `GovernanceWorkflowReviewStage`, `GovernanceWorkflowSubmitStage`, `GovernanceWorkflowPromotePersistStage`, `GovernanceWorkflowActivateStage`, `GovernanceWorkflowServiceSameTxAuditTests`.

## Decision

1. **Same pattern as TB-956:** Governance **submit**, **promote**, and **activate** domain writes **co-commit** with their matching **Required** durable audit events in the **same SQL UoW** when `IArchLucidUnitOfWork.SupportsExternalTransaction` is true.
2. **In-scope Required events:** `GovernanceApprovalSubmitted`, `GovernanceManifestPromoted`, `GovernanceEnvironmentActivated` — each enlisted via `IAuditService.LogAsync(event, uow, cancellationToken)` (or `GovernanceWorkflowAuditSupport.LogGovernanceDurableWithRetryInUnitOfWorkAsync`) **before** `CommitAsync`.
3. **Failure rolls back domain:** If Required audit append fails after bounded retry inside the UoW, the transaction **rolls back** — no "HTTP 500 after promote succeeded" orphan. Callers surface the same fail-closed error shape as approve/reject.
4. **In-memory / test path:** When `SupportsExternalTransaction` is false, stages retain sequential transition-then-audit behavior (unit tests with in-memory repos) — identical fallback to TB-956 approve/reject.
5. **Out of scope this ADR:** informational audit (**TB-001** — remains best-effort `TryLogAsync`); risk-waiver create/revoke (**TB-956** wave 2 unless already trivial); baseline mutation companion rows (recorded after successful UoW commit per existing dual-write); transactional audit outbox (deferred — `DapperAuditRepository.AppendAsync(..., connection, transaction)` enlistment is sufficient).
6. **Do not rewrite TB-956:** Approve/reject co-commit behavior, tests, and `GovernanceWorkflowReviewStage` contract stay unchanged. LP-09 implements wiring; this ADR is the durable decision reviewers cite.

## Trade-offs

**Gains:** Production-change moments gain parity with approve/reject audit atomicity; orphan probe **TB-955** should not fire for new submit/promote/activate rows after LP-09 ships; reviewers quote one ADR for "does audit co-commit with promote?"; fail-closed posture aligns with livelihood seat (ADR 0052 / R13) — no silent production change without durable ledger row.

**Sacrifices:** Longer SQL transaction hold time on promote/activate (audit append inside UoW); LP-09 must thread enlistment through three stage handlers without weakening approve/reject tests; integration outbox enqueue that today shares promote UoW must stay consistent (activate stage already branches on `TransactionalOutboxEnabled`); operators may see promote "failed" when audit insert fails — correct behavior, but noisier than post-commit best-effort.

**Rejected:** Post-commit Required audit for production-change paths (status quo); weakening approve/reject to match promote (regression); transactional audit outbox as prerequisite (infrastructure already supports enlistment); merging submit/promote/activate into one mega-stage; rewriting ADR 0075 coordinator echo; informational audit fail-closed (TB-001 scope unchanged).

## Constraints

- **Do not** rewrite Accepted ADR bodies 0067–0082 except **Related** pointers in follow-on PRs.
- **Do not** change TB-956 approve/reject co-commit implementation or weaken `GovernanceWorkflowServiceSameTxAuditTests`.
- **Do not** merge `DraftRequests` and `Runs` (ADR 0068). **Do not** unseal sealed records (ADR 0039).
- **Do not** flip `AgentExecution:Mode` default from **Simulator** to Real.
- **Do not** collapse desktop review workspace tabs behind **More**.
- **Do not** invent per-architecture ACL, live presence, or finding-comment chat (ADR 0037).
- **Tenant isolation** (ADR 0037): co-commit must not bypass catalog session scope or repository tenant guards.
- **Transactional audit outbox** not required when `AppendAsync` already enlists on the active connection/transaction.
- **TB-645 vocabulary** on operator-facing error copy if LP-09 surfaces new failure labels.
- Terraform for net-new infra — co-commit wiring should not require infrastructure beyond existing SQL/API paths.

## Expected impact

**System:** LP-09 enlists submit (`GovernanceWorkflowSubmitStage`), promote (`GovernanceWorkflowPromotePersistStage`), and activate (`GovernanceWorkflowActivateStage`) on the same UoW as Required audit; extends `GovernanceWorkflowServiceSameTxAuditTests` with submit/promote/activate cases; updates [`SAME_TX_GOVERNANCE_AUDIT_DESIGN.md`](../../library/SAME_TX_GOVERNANCE_AUDIT_DESIGN.md) in-scope table.

**Security:** Fail-closed co-commit prevents production-change domain rows without matching `dbo.AuditEvents` Required rows — reduces compliance gap where promote succeeded but audit trail is repairable only via orphan probe. Attackers cannot rely on audit failure leaving an unaudited production activation once gates ship. Tenant isolation unchanged — enlistment uses existing scoped repositories.

**Operations:** Support distinguishes audit-insert failure (rolled back — retry safe) vs domain conflict (409); on-call runbooks cite 0083 + TB-956 design doc; **TB-955** orphan alerts should decrease for new rows. Baseline mutation log dual-write remains post-commit companion — not the compliance ledger.

**Cost:** Engineering time for LP-09 stage wiring and tests; negligible runtime (one extra enlisted insert inside existing UoW); slightly longer transaction duration on promote/activate hot paths.

**Teams:** Principal architects gain defensible "promote and audit are one atomic fact" narrative for sponsor and ARB review; GTM procurement can cite parity with approve/reject when 0083 is **Accepted** and LP-09 is shipped.

## Consequences

- **Positive:** Production-change audit atomicity becomes a merge-blocking question; TB-956 pattern extends without forking; livelihood-proof wave closes the "hotter path weaker than signature" gap once LP-09 lands.
- **Negative:** LP-08 alone is contract-only — promote/submit/activate remain sequential until LP-09; short-term 0083 is "paper" until wiring ships; activate stage integration-outbox interaction needs careful LP-09 review.
- **Follow-ups:** LP-09 co-commit implementation; LP-10 authority-chain audit fail-closed; update `AUDIT_COVERAGE_MATRIX.md` co-commit column when LP-09 merges; LP-20 wave close audit evidence row for 0083 wired vs paper.
