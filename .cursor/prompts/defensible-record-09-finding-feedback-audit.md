# DR-09 — Finding feedback and ask paths write durable audit

**Do not invent finding-comment chat or live presence.** **Do not fork DR-07** — consume fail-closed echo if landed; otherwise use existing `IAuditService` success path.

## Goal

`POST` finding **feedback** (thumbs / useful) and finding **ask/conversation** persistence currently have **no** `IAuditService` row (`AUDIT_COVERAGE_MATRIX.md` known gaps). Add durable `AuditEvents` for those writes on Working: actor, finding id, run id, action, timestamp. Read-only ask that does not persist remains unaudited.

Do not put feedback text on Decision-grade findings. Feedback is an audit/ops signal, not a second disposition.

## Why

If livelihoods depend on the sealed record, “someone marked this finding helpful” during ARB is part of accountability. An unaudited side channel is a casual tool.

## Context

- `AUDIT_COVERAGE_MATRIX.md` ~feedback / ask gap
- Finding feedback controller/service
- Ask / conversation persist path
- ADR 0037 tenant isolation

## What to build

1. Audit event type names (stable) + matrix row.
2. Service calls `IAuditService` after successful persist; if DR-07 landed, do not swallow.
3. Tests: feedback persist → audit row; failed audit follows 0075 if Accepted.
4. UI unchanged except optional “Recorded” microcopy — no chat thread.

## Acceptance criteria

- A compliance export of `/v1/audit` includes finding feedback/ask writes for Working.
- No new collaboration surface.

## Constraints

- Team-tier 90-day retention stays as documented. No WORM platform.
