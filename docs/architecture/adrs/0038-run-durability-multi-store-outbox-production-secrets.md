> **Scope:** ADR 0038 — Run execution durability, Cosmos graph outbox, and production-like secrets posture.

> **Spine doc:** [`START_HERE.md`](../../START_HERE.md).

# ADR 0038: Run execution durability, Cosmos graph outbox, and production-like secrets

- **Status:** Accepted
- **Date:** 2026-06-06
- **Supersedes:** *(none)*
- **Superseded by:** *(none)*
- **Amends:** [ADR 0004](0004-transactional-outbox-retrieval-indexing.md) *(extends outbox pattern to authority pipeline work and Cosmos graph snapshots)*

## Context

Architecture reviews (2026-06-06) identified three production-readiness gaps:

1. **Run execution durability (#2):** Queued authority pipeline work could be enqueued outside the same SQL transaction as run header persistence; async mode was opt-in via feature flag even on SQL hosts; create-run coordination opened multiple unit-of-work boundaries.
2. **Multi-store consistency (#3):** When `CosmosDb:GraphSnapshotsEnabled` is true, graph snapshots were written directly to Cosmos during pipeline stages, risking SQL/Cosmos divergence on partial failure.
3. **Production-like secrets (#4):** SQL managed-identity enforcement applied only to `IsProduction()`; secret resolution could remain on `EnvironmentVariable` in Staging-like hosted profiles.

**Alternatives considered**

| Alternative | Outcome |
|-------------|---------|
| **Durable Functions / DTF for all authority stages** | Deferred — see **TB-302** / [V1_DEFERRED.md](../../library/V1_DEFERRED.md) §6f **DTF adoption decision gate (TB-921)**; transactional outbox + worker resume retained for V1. |
| **Cosmos-first graph write with SQL mirror** | Rejected — SQL is authority-of-record for run state; Cosmos is a polyglot projection. |
| **Keep async pipeline opt-in on SQL** | Rejected for production — queue mode reduces API latency and aligns with worker-hosted completion; explicit `false` remains for Advanced/local profiles. |
| **SQL + transactional outbox + unified create UoW + production-like KV/MI rules** (this ADR) | **Accepted** |

## Decision

### 1. Authority pipeline async default (SQL)

- When `StorageProvider=Sql` and `FeatureManagement:FeatureFlags:AsyncAuthorityPipeline` is **unset**, **`FeatureManagementAuthorityPipelineModeResolver` defaults to queue mode** (`true`).
- **InMemory** storage never queues (unchanged).
- **`appsettings.Production.json`** sets `AsyncAuthorityPipeline: true` explicitly; **`appsettings.Advanced.json`** may set `false` for local opt-out.

### 2. Transactional authority pipeline outbox

- **`IAuthorityPipelineWorkRepository.EnqueueAsync`** accepts optional **`IDbConnection` / `IDbTransaction`** so outbox rows enlist in the caller's SQL transaction.
- **`AuthorityRunOrchestrator`** enlists pipeline work in the same unit of work as run header persistence before commit (queue mode).
- **`ArchitectureRunCreateOrchestrator`** opens a **single** create-run unit of work, passes it through coordination → orchestrator, persists related rows, and commits once. Enlisted UoW is supported for **queue mode only** (inline + enlisted throws).

### 3. Cosmos graph snapshot outbox (SQL-first)

When `CosmosDb:GraphSnapshotsEnabled` is true on SQL storage:

1. Graph snapshot JSON is written to **SQL inside the authority transaction** via **`IGraphSnapshotSqlAuthorityWriter`**.
2. A row is inserted into **`dbo.CosmosGraphSnapshotOutbox`** (migration **246**) in the **same transaction**.
3. **`CosmosGraphSnapshotOutboxHostedService`** (worker/combined hosts) processes pending rows and upserts to Cosmos; retries follow hosted-service lease semantics.

InMemory storage registers **`NoOpCosmosGraphSnapshotOutboxRepository`**; graph remains SQL/InMemory only.

### 4. Production-like secrets and SQL credentials

- **`ArchLucidSecretProviderRules`:** production-like hosts (`IsProductionOrStagingLike`) require **`ArchLucid:Secrets:Provider=KeyVault`** and non-empty **`ArchLucid:Secrets:KeyVaultUri`**.
- **`SqlConnectionCredentialRules`:** SQL username/password rejection uses **`IsProductionOrStagingLike`** (not `IsProduction()` only); Staging may still log warnings via existing staging-specific helpers.

## Trade-offs

**Gains:** Atomic handoff from run create → pipeline queue → graph SQL → Cosmos projection; fewer orphaned runs on API crash; hosted pilots fail fast on plaintext secrets and SQL password strings.

**Sacrifices:** Create-run latency moves to worker for default SQL queue mode; Cosmos graph reads may lag SQL until outbox drains; local developers must opt out explicitly in Advanced profile or set the feature flag `false`.

## Constraints

- **Security:** Key Vault + managed identity for secrets in production-like profiles; no SQL password in connection strings when rules apply.
- **Scalability:** Outbox processors are leader-elected / hosted-service bounded; Cosmos writes are asynchronous and idempotent per outbox row.
- **Reliability:** Authority commit and outbox insert share one transaction; worker retries transient Cosmos failures; orchestrator SQL retries unchanged ([ORCHESTRATOR_RETRIES.md](../../library/ORCHESTRATOR_RETRIES.md)).
- **Cost:** Additional SQL rows and background Cosmos upserts when graph snapshots enabled; negligible vs LLM pipeline cost.

## Expected impact

- Operators see fewer stuck runs without outbox rows after API restarts.
- Graph snapshot consistency matches retrieval indexing outbox (ADR 0004) mental model.
- Staging/pilot deployments align with production secret transport before GA.

## Consequences

- **Positive:** Durable queue default on SQL; single create-run transaction; Cosmos graph is eventually consistent projection of SQL authority.
- **Negative:** Orchestration remains in `ArchLucid.Persistence` until **TB-302** (V1.1); tests must pass enlisted UoW through create orchestrator doubles.
- **Follow-ups:** Monitor **`CosmosGraphSnapshotOutbox`** stall via health/outbox probes; document worker requirement for queued pipeline in pilot runbooks.

## Links

- [ORCHESTRATOR_RETRIES.md](../../library/ORCHESTRATOR_RETRIES.md)
- [ARCHITECTURE_FLOWS.md](../../library/ARCHITECTURE_FLOWS.md) Flow A0
- [CONFIGURATION_REFERENCE.md](../../library/CONFIGURATION_REFERENCE.md)
- [TECH_BACKLOG.md](../../library/TECH_BACKLOG.md) **TB-302**
- Migration **`246_CosmosGraphSnapshotOutbox.sql`**
