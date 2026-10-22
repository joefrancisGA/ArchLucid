# ADR 0043: Durable run-export blob push outbox

**Status:** Accepted  
**Date:** 2026-06-06  
**Deciders:** Architecture review  
**Related:** [ADR 0004](0004-transactional-outbox-retrieval-indexing.md), [ADR 0038](0038-run-durability-multi-store-outbox-production-secrets.md), TB-251, TB-306

## Context

Post-commit projections to secondary stores use transactional outboxes drained by leader-elected workers. Retrieval indexing, Cosmos graph snapshot replication, and integration events already follow this pattern.

`POST /v1/artifacts/runs/{runId}/export/push` was the last post-commit projection using fire-and-forget `Task.Run`: the API returned `202 Accepted` and uploaded the ZIP in an unobserved background task. Process crash between accept and upload lost the push with no retry and no operator signal — unlike every other projection.

The export ZIP is deterministically rebuildable from the committed golden manifest and artifacts; persisting multi-megabyte ZIP bytes in SQL is unnecessary.

## Decision

1. **Add `dbo.RunExportBlobPushOutbox`** mirroring retrieval/Cosmos outbox lease, backoff, and dead-letter semantics.
2. **Enqueue at accept** — the push endpoint validates the destination SAS, confirms the run has a committed golden manifest, writes one outbox row (scope triple + destination URL), emits `RunExportBlobPushQueued`, and returns `202`. No ZIP build at enqueue time.
3. **Worker rebuilds payload** — `RunExportBlobPushOutboxProcessor` dequeues, re-validates the SAS URL, rebuilds the ZIP via `IRunExportPackageBuilder` (no Mermaid PNG render in the worker), uploads via existing `IRunExportBlobPushService`, and marks processed or retries/dead-letters.
4. **SAS URL at rest** — the customer-provided write SAS is persisted in the tenant-scoped outbox row, re-validated at processing time, never logged in full, and never written to audit `DataJson`. No new encryption-at-rest mechanism (SAS is short-lived and customer-owned).
5. **Shared builder with guardrails** — `IRunExportPackageBuilder` encapsulates ZIP construction for both GET download and the worker; callers own diagram PNG rendering and audit events (`RunExported` vs `RunExportBlobPushQueued`).
6. **New audit** — `RunExportBlobPushDeadLettered` when retries exhaust or destination re-validation fails at processing time.

## Trade-offs

| Choice | Benefit | Cost |
|--------|---------|------|
| Rebuild ZIP at processing (not persist bytes) | Small SQL rows; same pattern as retrieval/Cosmos | Worker repeats read + packaging work per attempt |
| Persist SAS URL in outbox row | Durability across restarts | Sensitive column; relies on tenant scope + short-lived SAS |
| Standalone enqueue (non-transactional) | Matches operator-initiated action on already-committed runs | Not atomically tied to a SQL UOW (acceptable — run already committed) |
| HTTP failure throws from push service | Outbox retries transient blob errors | Push service behavior change (only caller is now the processor) |

## Constraints

| Area | Treatment |
|------|-----------|
| **Security** | SAS re-validated at enqueue and processing; SSRF policy unchanged; dead-letter on invalid destination at processing time |
| **Scalability** | Leader-elected single drainer; bounded batch size; exponential backoff |
| **Reliability** | At-least-once upload; idempotent blob PUT semantics assumed for operator-safe retry |
| **Cost** | No new Azure services; modest SQL row churn; worker CPU for ZIP rebuild on retry |

## Expected impact

- Closes the last fire-and-forget post-commit projection (#4 secondary-store gap for run-export push).
- Operators gain pending/dead-letter observability consistent with other outboxes.
- GET download path behavior unchanged (same Mermaid gating, same `RunExported` audit).

## Alternatives considered

1. **Persist ZIP bytes in SQL** — rejected (multi-MB rows, inconsistent with other outboxes).
2. **Keep fire-and-forget with Polly in-process** — rejected (lost on API restart; no durable queue).
3. **Azure Storage Queue / Service Bus** — rejected for V1 (existing SQL outbox pattern is proven and IaC-simple).

## Verification

- `ArchLucid.Persistence.Tests` — `InMemoryRunExportBlobPushOutboxRepositoryRecoverabilityTests`
- `ArchLucid.Host.Composition.Tests` — `RunExportBlobPushOutboxProcessorTests`
- `ArchLucid.Application.Tests` — `RunExportPackageBuilderTests`, `RunExportBlobPushServiceTests`
- `ArchLucid.Api.Tests` — `ArtifactExportControllerRunExportTests`, `RunExportBlobPushOutboxHostedServiceTests`
