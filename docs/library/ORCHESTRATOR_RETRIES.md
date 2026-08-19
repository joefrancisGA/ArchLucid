> **Scope:** Contributor-reference — Authority run orchestrator retry, timeout, and resume semantics for operators and support.

# Authority orchestrator — retries, timeouts, and resume

**Related:** [ARCHITECTURE_FLOWS.md](ARCHITECTURE_FLOWS.md) (Flow A) Â· [CANONICAL_PIPELINE.md](CANONICAL_PIPELINE.md) Â· `AuthorityRunOrchestrator` (`ArchLucid.Application/Runs/Orchestration`)

This document describes how **`AuthorityRunOrchestrator`** recovers from transient failures, bounds pipeline duration, and resumes queued work. It applies to the SQL-backed authority pipeline registered behind **`IAuthorityRunOrchestrator`** in production hosts.

**DTF adoption gate:** Replacing this hand-rolled SQL state machine with the Durable Task Framework requires **two or more** simultaneous triggers from the [V1_DEFERRED.md §6f DTF adoption decision gate (TB-921)](V1_DEFERRED.md#dtf-adoption-decision-gate-tb-921). Async agent execute via the existing SQL outbox/worker path alone is **not** sufficient. The dormant `DtfAuthorityRunOrchestrator` seam is kept compiling via **TB-922**.

---

## Transient SQL retries (state persist and commit)

Long-running authority orchestration persists run state and commits unit-of-work boundaries through **`OrchestratorTransientDbRetry`** (`ArchLucid.Application/Runs/Orchestration/OrchestratorTransientDbRetry.cs`).

| Setting | Value |
|--------|--------|
| Policy | Polly exponential backoff via **`SqlOpenResilienceDefaults.BuildSqlOperationRetryPipeline`** |
| Max attempts | **3** retries (4 total tries including the first) |
| Backoff | **2s** base → **2s, 4s, 8s** (with jitter) |
| Retried operations | Run **`SaveAsync`**, unit-of-work **`CommitAsync`**, deferred pipeline **`EnqueueAsync`** (including **enlisted** enqueue in the same SQL transaction as run header persist) |
| Retried errors | **`SqlTransientDetector`**: deadlock (**1205**), timeout (**-2** / **`TimeoutException`**), Azure SQL unavailable/throttling (**40613**, **40197**, **40501**, **49918–49920**) |
| Not retried | Constraint violations, business logic failures, non-transient SQL errors — transaction rolls back and the exception propagates |

**Important:** Retries wrap **persistence calls only**. They do **not** re-run completed pipeline stages (ingestion, graph, findings, etc.). The state machine logic is unchanged; only the SQL I/O is retried.

---

## Pipeline timeout (LLM and stage wall clock)

Both **`ExecuteAsync`** (inline) and **`CompleteQueuedAuthorityPipelineAsync`** (queued resume) link caller cancellation to **`AuthorityPipelineOptions.PipelineTimeout`**:

1. A linked **`CancellationTokenSource`** calls **`CancelAfter(PipelineTimeout)`** when the configured timeout is **> 0**.
2. When the timeout fires, the orchestrator logs a pipeline timeout, increments **`PipelineTimeoutsTotal`**, rolls back the unit of work, and throws **`OperationCanceledException`** (filtered so caller-initiated cancellation is not mislabeled).
3. Individual LLM calls inherit this token through stage executors; there is **no separate LLM-only retry loop** inside the orchestrator — LLM failures surface as stage failures unless the agent runtime layer retries at a lower level.

Configure timeout under **`ArchLucid:AuthorityPipeline:PipelineTimeout`** (see host `appsettings` and [PILOT_GUIDE.md](customer-facing/PILOT_GUIDE.md))).

---

## Transactional outbox enqueue (queue mode)

When async authority mode applies (**SQL** storage; flag **unset defaults to queue mode** per [ADR 0038](../architecture/adrs/0038-run-durability-multi-store-outbox-production-secrets.md)), **`AuthorityRunOrchestrator`** inserts **`AuthorityPipelineWorkOutbox`** rows using the **same SQL transaction** as run header persistence. **`ArchitectureRunCreateOrchestrator`** may enlist a single create-run unit of work so coordination, orchestrator enqueue, and related row inserts **commit atomically**.

| Behavior | Detail |
|----------|--------|
| Enlisted UoW | Supported for **queue mode only**; inline pipeline + enlisted UoW throws at orchestrator boundary. |
| Create path | One UoW from create orchestrator through coordination → orchestrator → header patch → commit. |
| Cosmos graph (optional) | When **`CosmosDb:GraphSnapshotsEnabled`**, graph JSON is SQL-authoritative with **`CosmosGraphSnapshotOutbox`** in the same authority transaction; worker upserts to Cosmos asynchronously. |

---

## Queued pipeline resume

When **`FeatureManagement:FeatureFlags:AsyncAuthorityPipeline`** is enabled (or **unset on SQL**, which defaults to enabled) and an evidence bundle id is present, **`ExecuteAsync`** may enqueue work and return after the first commit. A background worker later calls **`CompleteQueuedAuthorityPipelineAsync`**:

| Behavior | Detail |
|----------|--------|
| Idempotent skip | If the run already has a **`ContextSnapshotId`**, completion is skipped and the existing row is returned (`queued_resume` → `skipped_idempotent_context_exists`). |
| Resume audit | Emits **`RunStarted`** with **`ResumedFromQueue: true`**. |
| Timeout | Same **`PipelineTimeout`** linkage as inline **`ExecuteAsync`**. |
| Failure | On any unhandled exception, the unit of work **rolls back**; the run remains in a resumable state for a later worker attempt (subject to outbox/worker retry policy). |

---

## Manual retry of failed runs (legacy coordinator path)

The **authority pipeline** and the **legacy coordinator** (`POST …/execute` → agent tasks → `POST …/commit`) are separate mental models ([ARCHITECTURE_FLOWS.md](ARCHITECTURE_FLOWS.md) Flow A0 vs A0b).

For **coordinator-driven** runs in **`Failed`** or **`ExecutionCompletedQualityRejected`** status:

1. **`POST /v1/architecture/review/{runId}/execute`** may be called again on the same run id.
2. The execute orchestrator emits audit event **`Run.RetryRequested`** with the previous status before re-running agent tasks.
3. Idempotent execute: if all expected **`AgentResult`** rows already exist, execute returns the prior outcome without re-invoking the LLM.

Authority-finalized runs (golden manifest already committed via the pipeline) should **not** be driven through execute/result unless you own legacy task semantics.

---

## Health and stall detection

**`OrchestratorHealthCheck`** (`ArchLucid.Host.Core/Health/OrchestratorHealthCheck.cs`) reports **Degraded** when:

- Agent tasks remain **`InProgress`** for more than **2 hours**, or
- **`AuthorityPipelineWorkOutbox`** rows are unprocessed for more than **2 hours**.

Registered on the host **`/health`** endpoint as check name **`orchestrator`**. InMemory storage skips the probe.

---

## Operator checklist

1. **Transient SQL blip during commit** — orchestrator retries automatically; check logs for `Transient SQL error on SQL operation`.
2. **Pipeline timeout** — increase **`PipelineTimeout`** or reduce evidence size; inspect stage spans (`authority.*` activities).
3. **Stalled queued work** — verify worker is running; inspect outbox rows and **`orchestrator`** health check.
4. **Failed coordinator run** — re-**execute** after fixing root cause; confirm **`Run.RetryRequested`** in audit trail.
