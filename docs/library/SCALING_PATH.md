> **Scope:** Scaling path (capacity, tenancy, and regions) - full detail, tables, and links in the sections below.

> **Spine doc:** [Five-document onboarding spine](../FIRST_5_DOCS.md). Read this file only if you have a specific reason beyond those five entry documents.


# Scaling path (capacity, tenancy, and regions)

## 1. Objective

Describe how ArchLucid scales from a **single shared SQL catalog** to **stronger isolation and geography**, and where the product **defers** work until metrics or contracts demand it.

## 2. Assumptions

- Most pilots start with **one logical database** and **row-level scope** (`tenant_id` / workspace / project) enforced in the application and optionally in SQL session context.
- Traffic is **multi-tenant**; a small number of tenants may dominate load.

## 3. Constraints

- **Security:** Prefer **private endpoints** and **deny-by-default** networking; never expose SMB (port **445**) or raw connection strings in dashboards or public telemetry.
- **Operational realism:** Sharding and multi-region stacks increase **blast-radius coordination** (migrations, backups, observability); defer until FinOps and latency evidence justify the cost.

## 4. Architecture overview

**Nodes:** API + worker Container Apps, Azure SQL, storage, LLM endpoints, observability (Prometheus / Grafana / Managed Grafana).

**Edges:** HTTP operator traffic, SQL read/write paths, async outbox processors, LLM completion calls.

**Flows:** Request-scoped writes on primary SQL; optional **read-scale-out** for selected queries; optional **secondary region** stack for DR / latency.

## 5. Component breakdown

| Concern | Mechanism today | Evolution |
|--------|------------------|-----------|
| **Tenant isolation (data)** | Scoped repositories + RLS session context (when enabled) | **Single-tenant-per-DB** (below) for regulated tenants |
| **Regional placement** | Primary region in `terraform-container-apps` | **`secondary_region.tf`** optional mirror (separate RG + CAE + apps) |
| **Read scaling** | Caching + indexed hot paths | **`IReadReplicaQueryConnectionFactory`** for read-only queries that tolerate replica lag |
| **Cost visibility** | `archlucid_llm_cost_usd_total{tenant=…}`, budgets | Grafana cost dashboard + Azure consumption budgets |

## 6. Data flow

1. **Writes** land on the **primary** SQL connection (authority pipeline, manifests, audit).
2. **Read replica** factories return a **secondary** connection when configured; callers must only run **idempotent reads** and tolerate **staleness**.
3. **Secondary region** (when `secondary_region_stack_enabled`) provisions parallel compute + telemetry; **Front Door** (see comments in `secondary_region.tf`) routes users to the nearest healthy origin.

## 7. Security model

- **Single-tenant-per-DB** shrinks credential scope per customer but multiplies **secrets**, **private endpoints**, and **pipeline** surface — adopt when contracts require hard isolation, not by default.
- **Dashboards** must query **metric labels** only (for example `tenant`, `tenant_id`); do not join application tables that could leak **connection strings** or PII into Grafana.

## 8. Operational considerations

### Single-tenant-per-database (option)

**Intent:** One Azure SQL logical server (or elastic pool) **per tenant** (or per small group), each with its own ArchLucid catalog.

**Deferred today because:** Requires **connection routing** per tenant (hosting middleware or gateway), **Terraform workspace / module fan-out** or pipeline-generated stacks, coordinated **migrations**, and **backup/restore** playbooks per tenant. The core codebase already scopes data by tenant within one catalog; splitting databases is an **operational partition**, not a prerequisite for V1 correctness.

### Per-region pinning (`infra/terraform-container-apps/secondary_region.tf`)

**What it does:** When enabled, provisions a **secondary** resource group, Log Analytics, Container Apps Environment, and mirrored **API / worker / UI** apps in `var.secondary_location`.

**Why defer toggling in dev:** Cost and **state** complexity; enable for staging/prod only after networking (subnet IDs, internal LB) is validated.

### Read-replica routing (`IReadReplicaQueryConnectionFactory`)

**What it does:** Implementations (for example manifest lookup, governance resolution, authority run list) open **read-intent** SQL connections so **read-heavy** paths do not contend with the writer on the primary.

**Deferred / partial:** Not every repository uses replica factories yet; expanding coverage is incremental and gated by **correctness** (no reads-after-write that require primary).

## 9. Scalability, reliability, cost

- **Scalability:** Horizontal scale of **stateless** API/worker replicas; SQL **vertical** scale first, then **partitioning** (per-tenant DB or elastic pools) when metrics show noisy neighbors.
- **Reliability:** Secondary region improves **regional failure** tolerance; replicas + outbox processors improve **throughput** under burst.
- **Cost:** Use **consumption budgets** (50 / 75 / 90% actual + 100% forecasted) and **LLM** dashboards to catch drift before invoice shock.

## 10. V2 Redis baseline — light load (`IGraphSnapshotProjectionCache`)

**Intent:** When **`IGraphSnapshotProjectionCache`** gains a Redis-backed implementation (see [`V1_DEFERRED.md`](V1_DEFERRED.md) §6e — distributed graph projection cache **V2 candidate**), provision **only what latency and coherence require**. Avoid defaulting to Premium clustered Redis “because enterprise.”

**Light-load baseline (default engineering target):**

- **SKU posture:** **Azure Cache for Redis — Basic** (or equivalent minimal managed Redis), **single node**, sized for **low request rates** and **small serialized snapshots**. Basic intentionally trades HA for **cost-efficiency** on this specific cache lane — graph projections are **rebuildable** from authoritative SQL + pipeline inputs.
- **Usage profile:** Suitable for early **multi-replica** API fleets where graph snapshot caching is **read-mostly advisory** and stale snapshots are acceptable within TTL.

**TTL and eviction:**

- **`IGraphSnapshotProjectionCache`** entries should use a **24-hour TTL** unless product telemetry proves shorter freshness is mandatory. Expired entries rebuild on next miss.

**Scale trigger:**

- **Review SKU / capacity** when sustained traffic to this cache exceeds **100 requests per minute** (organization-defined measurement window e.g. 15-minute rolling average). Crossing this threshold is a signal to evaluate **Standard** tier, larger memory, or **private endpoint** hardening — not an automatic mandate to deploy a multi-shard cluster.

**Trade-off:** Cost-efficiency and operational simplicity **over** Redis HA for **non-authoritative** projection material — authoritative graph truth remains **SQL-backed** with existing isolation rules.

**Security:** Redis must remain **private** (VNet injection / private endpoint); never expose Redis TLS endpoints publicly. Keep Terraform placement aligned with landing-zone assumptions (**private endpoints**, **deny-by-default** egress).

**Reliability:** Basic tier implies **accept brief unavailability** during provider maintenance; callers must **fall back** to cold-load projections without failing customer-visible workflows.

**Cost:** Keeps V2 cache infrastructure proportional to measured utilization instead of provisioning enterprise HA Redis before demand exists.
