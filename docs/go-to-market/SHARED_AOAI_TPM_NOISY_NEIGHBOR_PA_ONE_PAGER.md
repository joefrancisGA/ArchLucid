> **Reviewed:** 2026-07-28

> **Scope:** PA handout for shared CA / shared AOAI TPM noisy-neighbor fairness (GTM **M-297**). Contract: [`../library/SHARED_AOAI_TPM_NOISY_NEIGHBOR_FAIRNESS_CLAIM_MAP.md`](../library/SHARED_AOAI_TPM_NOISY_NEIGHBOR_FAIRNESS_CLAIM_MAP.md).

# Shared AOAI TPM — noisy-neighbor honesty

**Audience:** Principal architects evaluating multi-tenant capacity fairness.

**Claim:** There is **no cross-tenant TPM fair share** on a shared Azure OpenAI deployment. Tenant B load can drive **429 → breaker → Partial/Failed** for Tenant A. Do not sell “fair shared TPM.”

---

## Too strong vs safe

| Too strong | Safe |
| --- | --- |
| “Fair shared AOAI TPM across tenants” | Shared capacity; neighbor load can starve peers |
| “API scale-out removes AOAI 429” | HTTP scale ≠ TPM ceiling (**M-182**/**M-183**) |
| “Queue means Real success” | Queue ≠ Real execute success (**M-229**) |

---

## Safe pin

> On shared AOAI, noisy neighbors can induce throttling and partial/failed runs for others. Capacity planning and admission controls mitigate; they do not create per-tenant TPM fairness on a shared deployment.

**Related:** [`LAUNCH_LOAD_FAILURE_ORDER_DEGRADATION_PA_ONE_PAGER.md`](LAUNCH_LOAD_FAILURE_ORDER_DEGRADATION_PA_ONE_PAGER.md) · [`PAYING_TENANT_LLM_SPEND_STORM_PA_ONE_PAGER.md`](PAYING_TENANT_LLM_SPEND_STORM_PA_ONE_PAGER.md) · **G-SCALE-01**/**G-SCALE-02** (measured drills).
