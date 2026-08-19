# ADR 0044: Durable post-commit projection outbox

**Status:** Accepted  
**Date:** 2026-06-06  
**Deciders:** Architecture review  
**Related:** [ADR 0004](0004-transactional-outbox-retrieval-indexing.md), [ADR 0043](0043-durable-run-export-blob-push-outbox.md), TB-309

## Context

After run commit, `AuthorityDrivenArchitectureRunCommitOrchestrator` scheduled five fire-and-forget `Task.Run` side effects:

1. Provenance snapshot materialization  
2. Review-completed integration event  
3. Sample-run purge for tenant (non-sample commits)  
4. Finding priority rerank (feature-gated)  
5. IaC stub generation (feature-gated)

Process crash or unhandled exceptions in those background tasks lost work with no retry, no dead-letter path, and no operator visibility — unlike retrieval indexing, Cosmos graph snapshot replication, integration events, and run-export blob push (ADR 0043).

## Decision

1. **Add `dbo.PostCommitProjectionOutbox`** with `WorkType` discriminator, scope triple, optional `RunId`, optional `PayloadJson`, and the same lease/backoff/dead-letter semantics as other SQL outboxes.
2. **Enqueue after successful commit** via `PostCommitProjectionEnqueuer` — replaces all five `Task.Run` call sites. Feature gates (`RerankFindingsOptions.Enabled`, `GenerateIacStubsOptions.Enabled`, sample-run purge eligibility) apply at enqueue time.
3. **Leader-elected drainer** — `PostCommitProjectionOutboxProcessor` dispatches by `WorkType`, pushes ambient scope, and invokes the same application services previously called from `Task.Run`.
4. **Benign skip** — provenance materialization marks processed when `GetRunDetailAsync` returns null (run deleted or scope mismatch after commit).
5. **Dead-letter audit** — `PostCommitProjectionDeadLettered` when retries exhaust.

## Trade-offs

| Choice | Benefit | Cost |
|--------|---------|------|
| Single outbox table + WorkType | One drainer; consistent ops | Rows are heterogeneous; processor switch statement |
| Enqueue non-transactionally after commit | Simple; commit already durable | Brief window if enqueue fails before row written |
| Feature gates at enqueue | Avoids no-op rows when disabled | Re-enabling feature does not retroactively process past commits |
| Reuse existing side-effect services | Minimal behavior change | Processor depends on scoped application services |

## Constraints

| Area | Treatment |
|------|-----------|
| **Security** | Rows are tenant-scoped; ambient scope restored per row; no cross-tenant dispatch |
| **Scalability** | Leader-elected single drainer; bounded batch; exponential backoff |
| **Reliability** | At-least-once side effects; idempotent handlers assumed where possible |
| **Cost** | No new Azure services; modest SQL row churn |

## Expected impact

- Closes the last fire-and-forget post-commit projections on the authority commit path.
- Operators gain pending/dead-letter observability consistent with other outboxes.
- Commit latency no longer depends on background thread pool scheduling for these effects.

## Alternatives considered

1. **Keep `Task.Run` with Polly** — rejected (lost on restart; no durable queue).
2. **Separate outbox per work type** — rejected (five tables/drainers for V1).
3. **Azure Service Bus** — rejected (existing SQL outbox pattern is proven and IaC-simple).

## Verification

- `ArchLucid.Persistence.Tests` — `InMemoryPostCommitProjectionOutboxRepositoryRecoverabilityTests`
- `ArchLucid.Host.Composition.Tests` — `PostCommitProjectionOutboxProcessorTests`
- `ArchLucid.Application.Tests` — `PostCommitProjectionEnqueuerTests`
