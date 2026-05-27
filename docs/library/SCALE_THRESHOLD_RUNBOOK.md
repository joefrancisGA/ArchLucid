> **Scope:** Contributor-reference — Scale threshold runbook (hosted SaaS) — when to enable V1-optional scale controls and progressive capacity steps.

# Scale threshold runbook (hosted SaaS)

Operators use this runbook to decide when a **single-replica / small-fleet** posture is no longer sufficient and which **V1-optional** scale controls to enable. V1 does **not** require Redis, read replicas, or worker separation for GA; these are **progressive** controls documented in [V1_SCOPE.md](V1_SCOPE.md) and [V1_DEFERRED.md](V1_DEFERRED.md).

## Signals to scale

| Signal | Typical threshold | First response |
| --- | --- | --- |
| API p95 latency sustained above SLO | >2× baseline for 30+ minutes | Enable hot-path cache; split worker role; review SQL query plans (see **Query p95 checks** below) |
| SQL CPU >70% during business hours | 3+ consecutive days | Read replica for reporting; tune list indexes |
| Retrieval index lag | Outbox oldest age >15m (metric `archlucid_retrieval_indexing_outbox_oldest_pending_age_seconds`) | Dedicated indexing worker; increase batch size |
| Graph projection rebuild cost | High `KnowledgeGraph:ProjectionCache` miss rate | Distributed projection cache (Redis) |
| Per-tenant metric cardinality | OTel label explosion warnings | Enable tenant metric cardinality guard (see below) |
| Integration event outbox depth | Oldest pending age >15m or dead-letter growth | Scale worker role; tune outbox batch; see **Outbox scaling** |
| Authority pipeline outbox depth | `archlucid_authority_pipeline_work_pending` elevated | Dedicated worker; review poison messages — [`AUTHORITY_PIPELINE_OBSERVABILITY.md`](../runbooks/AUTHORITY_PIPELINE_OBSERVABILITY.md) |

## Query p95 checks (V1 — observability-driven)

Before adding replicas or Redis, confirm the bottleneck is not a missing index or hot list endpoint:

| Signal | Where to look | First response |
| --- | --- | --- |
| HTTP server duration p95 | App Insights / OTLP traces or Prometheus `http.server.request.duration` | Identify top routes (`/v1/architecture/runs`, governance lists, graph reads) |
| SQL command duration p95 | SQL DMVs + `archlucid_*` stage histograms | Tune indexes; route heavy readers to replica (below) |
| Authority stage p95 | `archlucid_authority_pipeline_stage_duration_ms` by `stage` | Split worker if `findings` / `artifacts` stages dominate API CPU |

**V1 posture:** observability-first triage — no mandatory APM SKU beyond Application Insights / OTLP already documented in [`OBSERVABILITY.md`](OBSERVABILITY.md).

## Outbox scaling (V1.x optional, configuration-driven)

| Outbox | Metric / signal | Keys / docs |
| --- | --- | --- |
| Retrieval indexing | `archlucid_retrieval_indexing_outbox_oldest_pending_age_seconds` | Worker separation; batch size in retrieval host options — [`PROVENANCE_INDEXING.md`](../runbooks/PROVENANCE_INDEXING.md) |
| Integration events | Dead-letter count + publish lag | `IntegrationEvents:TransactionalOutboxEnabled`, Service Bus namespace — [`INTEGRATION_EVENTS_AND_WEBHOOKS.md`](INTEGRATION_EVENTS_AND_WEBHOOKS.md), DLQ [`INTEGRATION_EVENT_DLQ_RETRY_POLICY.md`](../runbooks/INTEGRATION_EVENT_DLQ_RETRY_POLICY.md) |
| Authority pipeline | `archlucid_authority_pipeline_work_pending` | [`AUTHORITY_PIPELINE_OBSERVABILITY.md`](../runbooks/AUTHORITY_PIPELINE_OBSERVABILITY.md) |

**Trade-off:** Larger outbox batches improve throughput but increase poison-message blast radius — keep DLQ retry policy enabled before raising batch sizes.

## V1 controls (optional, configuration-driven)

### Hot-path cache (Redis)

- **Keys:** `HotPathCache:Provider`, `HotPathCache:RedisConnectionString` — see [CONFIGURATION_REFERENCE.md](CONFIGURATION_REFERENCE.md).
- **When:** More than one API replica **and** shared cache coherence is required across instances.
- **Trade-off:** Adds Redis cost and ops (patching, private endpoint); reduces duplicate SQL reads for warm list endpoints.

### Knowledge graph projection cache (distributed)

- **Keys:** `ArchLucid:KnowledgeGraph:ProjectionCache:Backend`, `ArchLucid:KnowledgeGraph:ProjectionCache:RedisConnectionString`.
- **When:** Graph snapshot projection rebuild dominates CPU on API nodes after commit-heavy workloads.
- **V1 default:** In-process memory per replica (no cross-node coherence).

### Read replicas (SQL)

- **When:** Executive dashboards, digests, and analytics readers contend with write-heavy commit windows.
- **V1 pattern:** Route read-only reporting queries to replica connection string in host configuration (application-specific; not mandatory for pilots).
- **Trade-off:** Replication lag (seconds) — provenance and run detail reads should stay on primary unless lag is bounded and documented.

### Worker separation

- **When:** Background jobs (retrieval indexing outbox, integration event outbox, advisory scans) steal CPU from interactive API.
- **Keys:** `ArchLucid:HostRole=Worker` (or dedicated worker profile in Helm/Terraform module) — see [`CONFIGURATION_REFERENCE.md`](CONFIGURATION_REFERENCE.md).
- **V1 pattern:** Deploy `ArchLucid.Host` with worker role so outbox processors and scans do not share the API process pool.
- **Trade-off:** Second fleet to patch and monitor; simpler blast radius for API latency.

### Warm tenant catalogs

- **Keys:** `WarmTenantCatalog:*` — see CONFIGURATION_REFERENCE.
- **When:** Cold-start latency after scale-out events or large tenant counts on a shared fleet.
- **Trade-off:** Memory footprint per standby catalog; disable on very small dev tenants.

### Per-tenant metric cardinality

- **When:** Custom high-cardinality labels appear in agent or retrieval metrics.
- **Action:** Keep `event_type`, `corpus_kind`, and `engine_type` labels bounded; avoid free-text tenant names in metric labels (use logs/traces for detail).

## V1.x / V2 (not required for V1 GA)

| Capability | Release window | Notes |
| --- | --- | --- |
| Mandatory Redis baseline in Terraform | V2 candidate | See V1_SCOPE § distributed cache |
| Multi-region active/active | V2 | DR runbooks separate |
| Auto-scaling policies as code | V1.x | HPA/KEDA after worker split |

## Cost and reliability summary

- **Security:** Prefer private endpoints for Redis/SQL when enabling distributed cache or replicas.
- **Reliability:** Worker split isolates outbox poison messages from API availability.
- **Cost:** Each optional tier adds managed service spend; enable only when signals above are sustained.
- **Scalability:** Scale reads before writes; provenance snapshots (TB-037) reduce repeated graph rebuild load on hot run pages.

## Related docs

- [CONFIGURATION_REFERENCE.md](CONFIGURATION_REFERENCE.md) — authoritative keys (`HotPathCache:*`, `ArchLucid:HostRole`, `IntegrationEvents:*`)
- [OBSERVABILITY.md](OBSERVABILITY.md) — export paths and p95-friendly metrics
- [DEPLOYMENT_RUNBOOK.md](DEPLOYMENT_RUNBOOK.md) — production-profile fail-fast including telemetry export
- [MULTI_TENANT_RLS.md](../security/MULTI_TENANT_RLS.md) — tenant isolation when adding replicas
- [TECH_BACKLOG.md](TECH_BACKLOG.md) — TB-037 provenance materialization; TB-029 notification boundary (shipped)
