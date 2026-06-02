> **Scope:** Operator-facing guide for **hosted ArchLucid** deployments — when in-process graph projection caching is enough, when Redis-backed shared cache is required, and how to spot multi-replica footguns. Not a change guide for application code.

# Projection cache and multiple API replicas

## Objective

Help operators and release managers choose cache settings that match **how many API processes** serve traffic, without changing durable graph data in SQL. This doc aligns with shipped configuration only (`ArchLucid:KnowledgeGraph:ProjectionCache:*`, `HotPathCache:*`, `LlmCompletionCache:Provider`).

## What is being cached

ArchLucid caches **read-through hydration** of **graph snapshot projections** (keys scoped by tenant/workspace/run/graph identifiers). The cache speeds up graph and provenance reads; **SQL remains authoritative**. Caching affects **latency and backend load**, not whether committed graph rows are correct.

Separate tiers also exist:

| Tier | Configuration | Purpose |
|------|----------------|---------|
| **Graph projection cache** | `ArchLucid:KnowledgeGraph:ProjectionCache:*` | Hydrated `GraphSnapshot` projections for authority/provenance graph paths |
| **Hot-path read cache** | `HotPathCache:*` | Manifests, runs, policy-pack metadata, and other high-churn reads |
| **LLM completion cache** | `LlmCompletionCache:Provider` | Optional distributed reuse of LLM responses |

Each tier can be configured independently. **Fixing graph projection for multi-replica does not automatically fix hot-path or LLM caches** — review all three when scaling out.

## When in-process projection (`Backend=Memory`) is sufficient

Use the default **`ArchLucid:KnowledgeGraph:ProjectionCache:Backend=Memory`** when:

- The API runs as a **single replica** (local `docker compose`, single Container Apps revision instance, one App Service instance without scale-out).
- You accept **per-process** cache warmth only (typical pilots and dev stacks).

`ProjectionCache:Enabled=false` disables read-through caching entirely (always hits persistent stores). Use for debugging, not as a multi-replica coherence strategy.

Default TTL: **`ProjectionCache:AbsoluteExpirationSeconds`** (default **300**). Entries invalidate on commit paths that call `IGraphSnapshotProjectionCache.Invalidate` for the affected run/graph.

## Multi-replica footguns (plain language)

When **two or more API containers** can receive traffic at the same time (horizontal scale, rolling deploy with old and new revisions both live, `minReplicas` > 1, etc.):

1. **No shared graph cache** — With `Backend=Memory`, each replica keeps its **own** entries. A warm cache on instance A does **not** help instance B.
2. **Uneven latency** — Load balancing sends users to cold and warm replicas unpredictably until each instance warms independently.
3. **Duplicate work** — Cold replicas may repeat the same SQL/projection work, increasing database pressure versus one shared cache tier.
4. **Stale-looking UI (usually short-lived)** — After a commit or graph update, a user might hit a replica that still holds an old cached projection until **TTL expires** or **invalidation** runs on that replica. Durable data is still correct; **refresh** or wait for TTL if a graph view looks behind immediately after finalize.
5. **Hot-path cache split-brain** — With `HotPathCache:Provider=Memory` (or `Auto` with `ExpectedApiReplicaCount=1` while actually running multiple replicas), manifest/run reads show the same per-replica pattern as graph projection.

These are **operational coherence** issues, not authorization or tenant-isolation defects.

## When Redis / shared cache is required

For **hosted production with more than one concurrent API replica**, configure **shared** caches:

### Graph projection (required for coherent graph cache across replicas)

1. Set **`ArchLucid:KnowledgeGraph:ProjectionCache:Backend=Distributed`** so `IGraphSnapshotProjectionCache` uses `IDistributedCache` (`GraphSnapshotProjectionDistributedCache`).
2. Provide Redis:
   - **`ArchLucid:KnowledgeGraph:ProjectionCache:RedisConnectionString`**, **or**
   - Rely on host composition fallbacks (`LlmCompletionCache:RedisConnectionString`, then `HotPathCache:RedisConnectionString`) when projection-specific string is unset.
3. Ensure **`IDistributedCache`** is registered (host composition wires StackExchange.Redis when a connection string is available). Startup validation fails if `Backend=Distributed` is set without Redis (`ArchLucid.Host.Composition`).

Use **private network paths** for Redis (private endpoint / controlled VNet), consistent with other `infra/` dependencies — do not expose cache endpoints to the public internet.

### Hot-path reads (strongly recommended with scale-out)

- Set **`HotPathCache:Enabled=true`**.
- Set **`HotPathCache:Provider=Redis`**, **or** **`Auto`** with **`HotPathCache:ExpectedApiReplicaCount`** aligned to your real maximum API replica count and **`HotPathCache:RedisConnectionString`** set.
- Outside Development, **`Auto` + `ExpectedApiReplicaCount` > 1** requires a Redis connection string (see `HotPathCacheRules` validation).

### LLM completion cache (optional)

- **`LlmCompletionCache:Provider=Distributed`** when you want completion reuse across replicas (separate from graph projection).

**V1 scope note:** Distributed graph projection cache is **shipped** when `Backend=Distributed` and Redis are configured. Mandatory Redis in all environments and Terraform baseline for every tenant tier remain **V2 candidates** — see [`V1_DEFERRED.md`](../library/V1_DEFERRED.md) §6e and [`V1_SCOPE.md`](../library/V1_SCOPE.md).

## How to validate coherence across replicas

Use these checks after changing replica count or cache settings:

1. **Configuration catalog** — In the operator UI, open **Admin → Configuration** (`/admin/configuration`). Confirm:
   - `ArchLucid:KnowledgeGraph:ProjectionCache:Backend` is `Distributed` when running multiple API replicas.
   - `HotPathCache:ExpectedApiReplicaCount` matches your scale-out ceiling when using `HotPathCache:Provider=Auto`.
2. **Environment health** — On the same page, review **Environment health** / config lint. Resolve **Fail** on Redis or cache-related rules before promoting traffic.
3. **API health** — `GET /health` / `GET /health/ready` includes an optional **Redis** probe (`OptionalRedisConnectionHealthCheck`) when a connection string is configured. Degraded Redis with `Backend=Distributed` means replicas may fall back to cold loads or fail startup validation depending on host settings.
4. **Cross-replica spot check** (manual):
   - Pick a run with a committed graph snapshot.
   - Call `GET /v1/authority/runs/{runId}/graph` twice in quick succession with **different** `X-Correlation-ID` values while load is spread across replicas (or hit two known instance URLs in a staging slot test).
   - With **Distributed** + healthy Redis, second hits should show lower backend latency in traces/logs; with **Memory** on multiple replicas, behavior may differ by instance.
5. **After commit** — Finalize a run, then load the graph in the UI. If one replica served stale cache, a **refresh** should show the updated graph once all replicas invalidate or TTL expires; persistent investigation if staleness persists beyond TTL indicates a defect, not expected Memory-backend behavior at scale.

CLI operators can also run **`archlucid doctor`** / **`archlucid health`** against the API base URL after deploy.

## Related documentation

| Topic | Document |
|--------|----------|
| Release-manager deployment notes (summary) | [`docs/engineering/DEPLOYMENT.md`](../engineering/DEPLOYMENT.md) |
| Configuration key catalog | [`docs/library/CONFIGURATION_REFERENCE.md`](../library/CONFIGURATION_REFERENCE.md) |
| V1 vs V2 Redis / projection posture | [`docs/library/V1_DEFERRED.md`](../library/V1_DEFERRED.md) §6e |
| Knowledge graph product concepts | [`docs/KNOWLEDGE_GRAPH.md`](../library/KNOWLEDGE_GRAPH.md) |
| Observability | [`docs/library/OBSERVABILITY.md`](../library/OBSERVABILITY.md) |
