> **Scope:** TB-1311 contract — first async-orchestration forcing workload and commit-safe run state machine freeze.

# Async orchestration first force (TB-1311)

## Verdict

**First product force for async agent execute:** multi-agent Real-mode `POST …/execute` that cannot finish inside API / Container Apps request lifetime. Implementation path: **SQL outbox + Worker** (same family as authority pipeline), **not** DTF / Service Bus first.

**First force for DTF / durable timers:** gated by TB-921 (≥2 of durable-timer-with-action, compensation/saga, novel outbox, checkpointed stage fan-out).

## State machine freeze (commit-safe split)

| Phase | Canonical status | Owner host | Durability |
|-------|------------------|------------|------------|
| Create | `Created` | API | SQL header |
| Authority materialize | `TasksGenerated` (via outbox) | Worker | `AuthorityPipelineWorkOutbox` lease |
| Agent execute | `TasksGenerated` → `WaitingForResults` → `ReadyForCommit` / `PartiallyCompleted` / `Failed*` | **API today**; **Worker target (TB-1311)** | **TB-943** execute ownership lease + reconciliation |
| Commit / finalize | `Committed` | API | CAS `sp_FinalizeManifest` |

Commit semantics **must not** change when execute moves async: finalize remains a separate verb with ROWVERSION CAS.

## Shipped enablers (this batch)

- **TB-943:** `dbo.RunExecuteOwnershipLeases`, acquire/release on execute, expired-lease reconciliation to honest terminal status.
- **TB-961:** release all execute leases held by this process on `ApplicationStopping`.
- **TB-962:** unit drill — live peer lease → `409 Conflict`; expired lease → `FailedPartial` / `PartiallyCompleted` via reconciliation.
- **Readiness split:** `DataConsistency:StaleInFlightRunsBlockReadiness` — stale in-flight is operational debt; orphan/cache divergence still blocks ready in production.

## Related

- [`CRASH_RECOVERY_LONG_RUNNING_REVIEW_CLAIM_MAP.md`](CRASH_RECOVERY_LONG_RUNNING_REVIEW_CLAIM_MAP.md)
- [`WORKER_ROLLING_DEPLOY_DRAIN_HANDOFF_CLAIM_MAP.md`](WORKER_ROLLING_DEPLOY_DRAIN_HANDOFF_CLAIM_MAP.md)
- [`docs/runbooks/STALE_IN_FLIGHT_RUNS.md`](../runbooks/STALE_IN_FLIGHT_RUNS.md)
