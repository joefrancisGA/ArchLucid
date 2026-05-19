> **Scope:** Deployment and rollback umbrella for **ArchLucid internal operators and release managers** - full detail, tables, and links in the sections below.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

> **Audience banner — read first.** ArchLucid is a **SaaS** product. **Customers never deploy ArchLucid; ArchLucid hosts it for them at `archlucid.net`.** This document is for **internal ArchLucid operators and release managers** running our hosted production / staging environments. Customer entry points: **[`START_HERE.md`](../START_HERE.md)** "Audience split" and `archlucid.net`.

# Deployment and rollback (umbrella — internal operators)

This document ties together how **ArchLucid** (product; repository and assemblies still use `ArchLucid.*` until rename Phase 5–6) is released, how database changes roll forward, and where to find deeper procedures. It is aimed at **internal operators and release managers**, not at local `docker compose`-only workflows (see **`docs/engineering/BUILD.md`** and **`docs/engineering/CONTAINERIZATION.md`**).

**New to the repo?** Phased checklist from laptop to Azure: **`docs/onboarding/day-one-sre.md`** (and **`docs/START_HERE.md`** hub).

## Objectives

- Apply application + infrastructure changes in a **predictable order** (schema before behavior that depends on new columns, or feature flags when order cannot be guaranteed).
- Preserve a **credible rollback story**: either revert application version, restore data, or disable features — not all three are always possible; the runbooks below spell out which applies.

## Assumptions

- Production uses **`ArchLucid:StorageProvider=Sql`** (see [ADR 0011 — InMemory vs Sql](../architecture/adrs/0011-inmemory-vs-sql-storage-provider.md)).
- SQL is reachable only from **private network paths** (private endpoint / VNet integration), not from the public internet.
- Optional components (Redis, Azure AI Search, etc.) follow the same “config-gated” pattern as in **`infra/`** Terraform roots.

## Knowledge graph projection cache (multi-replica)

The API optionally caches **read-through hydration** of **graph snapshot projections** (keys scoped by authority tenant/workspace/run/graph identifiers — see **`ArchLucid.KnowledgeGraph`** projection caching).

### Default: Memory backend (`ProjectionCache:Backend=Memory`)

The shipped default uses **`IMemoryCache`** inside **each process**. That is appropriate for **single-replica** pilots or dev stacks because it minimizes dependencies.

**Limitations when you run multiple API replicas** (horizontal scale behind Front Door, Container Apps `minReplicas`/`maxReplicas` > 1 across revisions serving traffic simultaneously, etc.):

- **No shared cache:** Each replica owns disjoint entries; a warm cache on instance A does not help instance B.
- **Amplified rebuild/load:** Cold replicas independently rebuild or reload projections until locally warmed — duplicate SQL/read pressure versus one shared tier.
- **Uneven latency:** Load-balanced callers hit replicas at different cache hit rates until each instance warms (persisted graph rows remain authoritative; caching affects latency and backend effort, not durable correctness).

### Strong recommendation for scaled production

For **hosted SaaS production where the API runs more than one concurrent replica**, **prefer Redis-backed projection caching**:

1. Set **`ArchLucid:KnowledgeGraph:ProjectionCache:Backend=Distributed`** so **`IGraphSnapshotProjectionCache`** uses **`IDistributedCache`** (`ArchLucid.Host.Composition`).
2. Ensure **`IDistributedCache`** resolves to Redis — configure **`ArchLucid:KnowledgeGraph:ProjectionCache:RedisConnectionString`** **or** rely on the host fallback chain (projection-specific Redis string unset falls through to LLM / hot-path Redis connection strings where composition wires **`GraphSnapshotProjectionDistributedCache`**).

Treat Redis like other private-plane dependencies (typically **Azure Cache for Redis** + **private endpoint / controlled network path**, aligned with **`infra/`** roots — never expose cache endpoints broadly).

Key catalog (presence semantics and TTL): [CONFIGURATION_REFERENCE.md](../library/CONFIGURATION_REFERENCE.md). Background **`Hosting:Role=Worker`** processes that exercise projection caching benefit from the same **`Distributed`** setting.

Operator playbook (footguns, validation, hot-path cache): [PROJECTION_CACHE_AND_REPLICAS.md](../operations/PROJECTION_CACHE_AND_REPLICAS.md).

## Application deployment

1. **Build and publish** the API image (or package) from **`ArchLucid.Api`** using your pipeline; tag with an immutable version. The same Docker image also carries **`ArchLucid.Worker.dll`** for Azure Container Apps worker revisions (see **`docs/engineering/CONTAINERIZATION.md`**).
2. **Run database migrations** with **DbUp** (`ArchLucid.Persistence.Data.Infrastructure.DatabaseMigrator`) against the target database **before** or **in lockstep** with rolling out the API version that requires new schema. See **`docs/runbooks/MIGRATION_ROLLBACK.md`** for failure handling.
3. **Roll out** the new API revision (App Service slot swap, Container Apps `az containerapp update`, AKS rolling update, etc.). Prefer **health-checked** deployments so readiness fails if SQL or required config is wrong. For GitHub Actions–driven Azure Container Apps, use **[DEPLOYMENT_CD_PIPELINE.md](../library/DEPLOYMENT_CD_PIPELINE.md)** (build → push to ACR → update API, optional worker and UI apps → smoke).
4. **Smoke** critical paths: architecture run create → execute → commit, comparison replay (if enabled), governance endpoints if used.

## Rollback

- **Application-only rollback:** deploy the previous image/package. Safe when the new version did **not** apply irreversible migrations.
- **After forward-only migrations:** rolling back code without reverting schema may still work if new columns are unused; if not, plan **forward fixes** instead of schema downgrade (preferred posture — see migration runbook).
- **Disaster / data loss:** restore from **point-in-time** or geo-replicated copy; see **`docs/runbooks/DATABASE_FAILOVER.md`**.

## Related documentation

| Topic | Document |
|--------|-----------|
| Configuration keys (projection cache, Redis fallbacks, TTL) | [library/CONFIGURATION_REFERENCE.md](../library/CONFIGURATION_REFERENCE.md) |
| Migrations, DbUp, rollback posture | [runbooks/MIGRATION_ROLLBACK.md](../runbooks/MIGRATION_ROLLBACK.md) |
| RTO/RPO targets by tier (dev / staging / production) | [RTO_RPO_TARGETS.md](../library/RTO_RPO_TARGETS.md) |
| Azure SQL HA, failover, RPO/RTO | [runbooks/DATABASE_FAILOVER.md](../runbooks/DATABASE_FAILOVER.md) |
| Terraform roots and environments | [infra/README.md](../../infra/README.md) |
| GitHub Actions CD (ACR, Container Apps, optional Terraform) | [DEPLOYMENT_CD_PIPELINE.md](../library/DEPLOYMENT_CD_PIPELINE.md) |
| Failed deploy / manual rollback (operators) | [DEPLOYMENT_RUNBOOK.md](../library/DEPLOYMENT_RUNBOOK.md) |
| Containers and compose profiles | [CONTAINERIZATION.md](CONTAINERIZATION.md) |
| Build and test | [BUILD.md](BUILD.md) |
| Storage provider semantics | [adr/0011-inmemory-vs-sql-storage-provider.md](../architecture/adrs/0011-inmemory-vs-sql-storage-provider.md) |

## CORS (browser → API)

The API registers policy **`ArchLucid`** (`UseCors("ArchLucid")` in the pipeline).

| Configuration | Behavior |
|---------------|----------|
| **`Cors:AllowedOrigins`** (array) | If **empty or missing**, **no** browser origin is allowed (`SetIsOriginAllowed(_ => false)`). If non-empty, only those exact origins receive `Access-Control-Allow-Origin`. |
| **`Cors:AllowedMethods`** (array, optional) | Defaults: **`GET`**, **`POST`**, **`PUT`**, **`DELETE`**, **`OPTIONS`**. **`OPTIONS`** is required for preflight. If you set this array, it **replaces** the default list (include every method you need). |
| **`Cors:AllowedHeaders`** (array, optional) | Defaults: **`Content-Type`**, **`Authorization`**, **`X-Api-Key`**, **`X-Correlation-ID`**, **`Idempotency-Key`**, **`Accept`**. Aligns with the operator UI proxy and idempotent run creation. If you set this array, it **replaces** the default list—add any extra request headers your SPA sends. |

Production validation (`ArchLucidConfigurationRules.CollectErrors` → `ProductionSafetyRules` + `BillingProductionSafetyRules`) still requires a non-empty **`Cors:AllowedOrigins`** without wildcard `*`.

## Security note

Do not expose SMB (port 445) or SQL endpoints publicly. Align with private endpoints and controlled boundaries described in infrastructure Terraform and org network standards.
