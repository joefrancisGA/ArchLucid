# Capacity and cost playbook

## 1. Objective

Give operators a **first-principles** way to scale ArchLucid/ArchiForge and control **Azure spend** without over-provisioning from day one.

## 2. Assumptions

- **Traffic grows unevenly**; teams may lack perfect forecasts.
- **Private networking** and **managed identity** are preferred over shared keys.

## 3. Constraints

- **Reliability** targets are environment-specific; this playbook suggests **indicators**, not universal SLOs.
- **FinOps** tags (`llm_provider`, `llm_deployment`) exist on token counters when enabled — watch **cardinality** in Prometheus.

## 4. Architecture overview

**Bottleneck classes:** API CPU/memory, Worker throughput, **SQL DTU/vCore**, **LLM token rate**, **Service Bus** throughput, **egress** from blob/diagnostic logs.

## 5. Component breakdown

| Layer | Scale signal | Knob (examples) |
|-------|--------------|------------------|
| **Container Apps** | CPU throttling, revision restarts | Increase CPU/memory; split API vs Worker replicas; min replicas in prod. |
| **SQL** | DTU/vCore maxed, long query store | Scale tier; index/outbox retention; archive cold runs. |
| **Outboxes** | Gauges in `ArchiForge` meter | Add worker instances; fix poison messages; use admin DLQ tools. |
| **LLM** | `archiforge_llm_*_tokens_total` | Cheaper deployment, caching, smaller prompts, quota per tenant. |
| **Front Door / APIM** | 429/latency at edge | Caching rules, rate limits, regional PoPs. |

## 6. Data flow

User/API load → compute → SQL write path → outbox/async → external integrations. **Cost** accrues on **compute hours**, **SQL**, **LLM tokens**, **egress**, and **observability retention**.

## 7. Security model

- Scaling **out** must not **widen** blast radius: maintain **private endpoints**, **least-privilege** RBAC, and **secret rotation** when adding replicas or regions.

## 8. Operational considerations

- **Start minimal:** single revision, modest SQL tier, Worker replica count aligned with outbox depth alerts (`infra/prometheus/archiforge-alerts.yml`).
- **Evolve:** separate **read scaling** (cached read models) from **write scaling** (partitioning hot tenants, job sharding) when metrics justify.
- **Review monthly:** top queries, token dashboards, unused environments, log retention.
