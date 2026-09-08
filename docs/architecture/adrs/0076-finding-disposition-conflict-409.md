> **Scope:** ADR 0076 — Concurrent finding disposition conflict (409) on Working.

> **Spine doc:** [`START_HERE.md`](../../START_HERE.md).

# ADR 0076: Finding disposition current-pointer conflict (409)

- **Status:** Accepted
- **Date:** 2026-09-06
- **Supersedes (Working target):** TB-986 Option A last-timestamp-wins **current** semantics in [`FINDING_CONCURRENT_DISPOSITION_CONFLICT_CONTRACT.md`](../../library/FINDING_CONCURRENT_DISPOSITION_CONFLICT_CONTRACT.md) — history remains append-only; only the **current pointer** is CAS-protected.

## Context

TB-986 (2026-08-10) shipped **append-only** `dbo.FindingReviewEvents` with **current = latest `OccurredAtUtc`**. Both racing writers received HTTP 200; inspect showed whichever event had the later timestamp. TB-987 added post-save honesty when a reload showed a newer event, but the loser still believed their write was current.

Governance **approval requests** already use first-wins CAS (`TryTransitionFromReviewableAsync`; loser **409** / `GovernanceApprovalReviewConflictException`). Finding dispositions are livelihood writes — two architects accepting and rejecting the same finding must not both think they won.

**Rejected alternatives:**

- **Mutex / serializable session on the finding row:** Risk of deadlocking long execute paths; deferred.
- **Delete or rewrite prior disposition events on conflict:** Violates append-only sealed trail (ADR 0039 posture).
- **Drop append-only history:** Violates audit and record-correction model (PC-10 / LI-05).

**Related:** ADR 0075, TB-986/TB-988, RS-11 conflict recovery, DR-08 implementation batch.

## Decision

1. Add **`dbo.FindingCurrentDispositions`** — one row per scoped finding with `CurrentEventId` FK to `FindingReviewEvents` and **`RowVersionStamp ROWVERSION`** for optimistic concurrency on the **current pointer only**.
2. **`POST /v1/governance/findings/{findingId}/dispositions`** accepts optional **`expectedCurrentDispositionRowVersionBase64`**. When a current pointer exists, the server requires a matching row version; mismatch → **409 Conflict** with the winner's disposition (event id, kind, actor, timestamp, row version).
3. **Trail remains append-only** — conflict applies to advancing the current pointer, not to inserting history. Losers use **Record correction** (existing) if their event should not stand as current.
4. **Transaction order:** `UPDLOCK` read pointer → validate expected version → `INSERT` event → `UPDATE`/`INSERT` pointer → commit.
5. **Guided** clients that omit `expectedCurrentDispositionRowVersionBase64` when no pointer exists may still record the first disposition; when a pointer exists, omission is treated as stale client state and returns **409** with current payload (forces reload). Working UI always sends the version from list/history/inspect.

## Trade-offs

**Gains:** Second writer cannot silently become current; aligns with governance approval CAS; 409 payload exposes server truth; append-only history preserved; no execute-path mutex.

**Sacrifices:** Clients must track `currentDispositionRowVersionBase64`; extra table + migration backfill; concurrent first-disposition races resolve via unique key (one winner, one 409); Guided fixtures that relied on dual-success races need reload-and-retry or documented residual.

**Guided residual:** Teaching flows may still document that history contains both events when operators retry after 409; inspect **current** is no longer “latest timestamp wins.”

## Constraints

- Do not lengthen `MUTATION_UNDO_WINDOW_SECONDS` (300s).
- Do not fork PC-10 grid amend — conflict UI is concurrency recovery, not undo UX.
- Do not introduce execute mutex or sealed-trail rewrite.
- Tenant scope on pointer read/write (`TenantId`, `WorkspaceId`, `ProjectId`).
- SQL DDL in numbered migration **370** + baseline discipline per `SQL_DDL_DISCIPLINE.md`.

## Expected impact

**System:** `FindingDispositionService` uses `IFindingDispositionConcurrencyRepository`; API returns 409 + extension payload; inspect/history DTOs expose row version for clients.

**Security:** Reduces silent overwrite of current disposition; tenant-scoped pointer.

**Operations:** One-time backfill migration from latest disposition events; no new infra.

**Cost:** Negligible — one narrow row per finding with disposition.

**Teams:** Engineering DR-08; GTM updates TB-986 “safe claim” row via contract doc supersede note (not buyer attestation change).

## Consequences

- **Positive:** Career-defensible concurrent disposition; quotable ADR; RS-11 can mount inline conflict on disposition forms.
- **Negative:** Clients must refresh after 409; bulk disposition stops on first conflict unless extended later.
- **Follow-ups:** DR-09 finding-feedback audit; RS-14 merge-conflict list cue (orthogonal).
