> **Scope:** ADR 0075 — Coordinator durable audit echo fail-closed on Working governed mutations.

> **Spine doc:** [`START_HERE.md`](../../START_HERE.md).

# ADR 0075: Coordinator audit echo fail-closed on governed mutations

- **Status:** Accepted
- **Date:** 2026-09-06

## Context

ArchLucid maintains a **dual-channel** audit model (`docs/library/AUDIT_COVERAGE_MATRIX.md`):

1. **Baseline mutation log** — structured `ILogger` lines via `IBaselineMutationAuditService.RecordAsync` (grep-friendly, log-pipeline retention).
2. **Durable echo** — `dbo.AuditEvents` rows under `AuditEventTypes.Run.*` appended by `BaselineMutationAuditArchitectureDurableWriter`.

Coordinator create / execute / commit orchestrators always write the baseline channel first, then echo durable rows. Until this ADR, durable echo failures used `DurableAuditLogRetry.TryLogAsync` and `BaselineMutationAuditService` swallowed exceptions so orchestration could complete while `archlucid_audit_write_failures_total` incremented. That is **fail-open** for a career record: the architect sees success while the compliance ledger may be missing `Run.CommitCompleted`.

**TB-953** already fail-closed direct `IAuditService` writes for governance approve (`GovernanceWorkflowAuditSupport`), finding disposition (`RunOperatorGovernanceDispositionService`), finalize (`ManifestFinalizationService`), and related Required types (`RequiredAuditEventTypes`). The **coordinator echo gap** remained on finalize: `Architecture.RunCompleted` → `Run.CommitCompleted`.

**Rejected alternatives:**

- **Option B (succeed + blocking receipt):** Persist a user-visible failed-audit receipt on the run and block career export until reconciled — more UX surface; deferred unless product later needs partial-success semantics.
- **Drop baseline channel:** Violates layered audit enforcement and SIEM grep workflows.
- **Make every coordinator echo Required:** Execute/create telemetry should stay informational (TB-001); only governed mutations fail closed.

**Related (not rewritten):** ADR 0039 (sealed evidence), TB-953 / TB-954, `LAYERED_AUDIT_ENFORCEMENT.md`, DR-07 implementation batch.

## Decision

1. **Governed coordinator baseline events** (Working finalize today: `AuditEventTypes.Baseline.Architecture.RunCompleted`) must use `DurableAuditLogRetry.LogOrThrowAsync` for their durable echo, not `TryLogAsync`.
2. **`Run.CommitCompleted`** is added to `RequiredAuditEventTypes` and must not appear with `TryLogAsync` in product code (TB-954 guard).
3. **`BaselineMutationAuditService`** must **re-throw** `DurableAuditWriteFailedException`; it must not swallow fail-closed echo failures.
4. **Non-governed** coordinator echoes (`RunCreated`, `RunStarted`, `RunExecuteSucceeded`, `RunFailed`, `RunQualityGateRejected`) remain **informational** — `TryLogAsync` + metric only.
5. **Disposition and governance approve** paths are unchanged — they already call `LogOrThrowAsync` on direct Required event types (not coordinator echo).

When durable echo fails after retries, the API returns an error (typically HTTP 500 with `DurableAuditWriteFailedException`) even if the domain mutation already committed — documented TB-953 residual; operators reconcile via orphan probes (TB-955).

## Trade-offs

**Gains:** Finalize cannot report silent success without `Run.CommitCompleted` in `dbo.AuditEvents`; reviewers can cite ADR 0075 to refuse “best-effort audit”; aligns coordinator finalize with TB-953 Required posture; metric remains but is not the only signal.

**Sacrifices:** Transient SQL audit outages can surface user-visible finalize failures after manifest commit (orphan risk unchanged from TB-953); execute/create echoes stay soft-fail to avoid blocking long-running LLM work on telemetry alone; slightly more complex writer split (governed vs informational echoes).

**Rejected:** Universal fail-closed on all `Run.*` echoes (would block execute on audit blips); blocking receipt without fail (Option B) — extra schema/UX not needed for V1.

## Constraints

- Do not rewrite ADR 0039 sealed-evidence DENY rules.
- Do not remove baseline `ILogger` channel or dual-write pairing.
- Do not expose baseline-only rows via `/v1/audit` (out of scope).
- Dev `dbo` skip-DENY and informational telemetry (TB-001) remain documented residuals.
- No per-architecture ACL (ADR 0037 workspace scope unchanged).
- Architecture tests (`AuditPathClassificationArchitectureTests`) must keep `Run.CommitCompleted` off `TryLogAsync` call sites.

## Expected impact

**System:** `BaselineMutationAuditGovernedRunCompletedEchoWriter` uses `LogOrThrowAsync`; `RequiredAuditEventTypes` includes `Run.CommitCompleted`; finalize commit stage propagates audit failure to API layer.

**Security:** Stronger integrity between governed mutations and durable ledger; operators no longer rely solely on Prometheus counters for finalize audit loss.

**Operations:** Possible increase in finalize 500s during audit DB incidents; existing TB-955 orphan triage applies; no new infra.

**Cost:** Negligible — same number of audit rows; retry/backoff unchanged.

**Teams:** Engineering implements DR-07; GTM claim boundary unchanged (Required vs informational per M-117).

## Consequences

- **Positive:** Career-defensible finalize path; audit matrix and ADR are quotable; consistent with disposition/approve fail-closed behavior.
- **Negative:** Rare finalize success-without-audit-row window closes at API layer but domain orphan window remains until TB-956 same-TX work.
- **Follow-ups:** DR-08 disposition concurrency (ADR 0076); DR-09 finding-feedback audit rows; optional same-TX finalize audit (TB-956).
