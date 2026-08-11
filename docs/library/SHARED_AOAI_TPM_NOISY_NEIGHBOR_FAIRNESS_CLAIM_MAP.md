> **Scope:** Contributor-reference claim map for engineering and principal-architect diligence; not a buyer brochure.

# Shared Container Apps / shared AOAI TPM — noisy-neighbor fairness

**Audience:** Engineering, security reviewers, principal-architect diligence. Not a buyer brochure.

**Status:** **Done** (2026-08-11) for **TB-1577** / GTM **M-296**. Pair honesty CI **TB-1578** / **M-296** (open).

**Verdict (one line):** There is **no cross-tenant fair share of shared Azure OpenAI TPM** today — only per-tenant **spend/abuse caps** and per-tenant HTTP rate limits. When tenant A saturates the deployment, tenant B shares Polly **429 → optional secondary AOAI → shared circuit breaker → Partial/Failed** (not fair-queue, not silent “slow success”).

---

## 1. What exists (fairness vs spend)

| Control | Scope | Fairness of shared TPM? | Notes |
|---------|--------|-------------------------|--------|
| `LlmTokenQuota` | Per-tenant sliding tokens | **No** — own spend/abuse cap | Prod on; **in-process** (not multi-replica-tight) |
| `LlmDailyTenantBudget` | Per-tenant UTC-day tokens | **No** — own spend cap | SQL durable; fail-closed |
| `LlmMonthlyTenantDollarBudget` | Per-tenant estimated USD | **No** — own spend cap | When enabled; INV-004 |
| Run-scoped admit (**TB-939**) | Per-run vs own headroom | **No** — admit vs own budget | Not peer TPM |
| HTTP fixed-window rate limit | Per `tenant_id` | Request storm brake only | Does **not** sense AOAI TPM |
| `AgentHandlerConcurrencyGate` | Process-wide semaphore | **Anti-isolation** under load | Shared across tenants on replica |
| AOAI Polly + circuit breaker | Deployment / gate | **Couples** A→B | A’s 429s can open breaker for all on host |
| Authority pipeline concurrency | Per-tenant slots | SQL/authority stages only | **Not** LLM TPM fairness |
| Fair queue / WFQ / priority | — | **Not shipped** | — |
| TPM-aware admission | Named in **TB-1336** | **Open / not shipped** | Cheapest future capacity move |
| Container Apps scale | Shared API/Worker | More replicas ≠ more TPM | **TB-915** / **TB-947** |
| Quick Scan global USD | Anonymous plane | Contrast only | Not paid-tenant fairness |

**Spend ≠ fairness:** **TB-1570** / **M-294** cover compromised-key spend storms and metering disputes. This map covers **multi-tenant TPM contention**.

---

## 2. What tenant B experiences when A saturates TPM

| Stage | B’s experience |
|-------|----------------|
| Shared deployment | A and B compete for the **same** AOAI TPM quota |
| Transient 429 | Polly retries (backoff); latency up |
| Sustained throttle | Optional secondary AOAI; then **shared breaker** fail-fast for tenants on that host |
| Product Real | After chain: **Partial / Failed** (Done **TB-937**); not silent Simulator; queue ≠ Real success (**TB-1299**) |
| Silent starvation? | **No** silent success — failures/partials/slower retries |
| Own budgets still apply | B can hit own token/$ caps even when TPM recovers; B can also be TPM-blocked **before** own spend caps if A filled the deployment |

---

## 3. Too-strong vs safe

| Too strong | Safe |
|------------|------|
| “Per-tenant fairness / fair share of TPM” | Per-tenant **spend and HTTP** caps; **no** WFQ or TPM partition |
| “Token budgets isolate tenants from each other’s AOAI load” | Budgets stop **own** overspend; shared TPM/breaker still couples A→B |
| “More CA replicas fix noisy-neighbor LLM” | Replicas amplify concurrency into the **same** TPM |
| “429 → graceful Real success / queued Real” | Retry then fail-closed Partial/Failed |
| “Authority per-tenant slots = LLM fairness” | Caps authority heavy stages, not completions |
| “Sliding `LlmTokenQuota` is multi-replica-tight” | Window tracker is **per-process**; daily/monthly SQL is durable |
| Conflate **TB-1570** spend-storm with fairness | Spend-storm ≠ cross-tenant TPM fair share |

---

## 4. Related owners (orchestrate — do not duplicate)

| ID | Role |
|----|------|
| Open **TB-1336**–**TB-1337**, **M-237**/**M-238** | 100× / **TPM-aware admission** capacity ledger |
| Open **TB-1032**–**TB-1033**, **M-182**/**M-183** | Launch-load shape (≠ sustained TPM fairness) |
| Done **TB-1299**; open **TB-1300**, **M-229**/**M-230** | Execute policy under AOAI 429 |
| Done **TB-915**/**TB-946**/**TB-947**; **G-SCALE-01**/**G-SCALE-02** | CA scale + TPM ceiling + drills |
| Done **TB-1287** / **M-225**, Done **TB-1570** / **M-294** | FinOps / spend-storm (adjacent) |
| **TB-1577** / **M-296** | This noisy-neighbor fairness claim map |

---

## 5. Optional follow-ons (not required to close honesty pin)

- Ship TPM-aware admission (**TB-1336**) with per-tenant fair-share or weighted weights.
- Per-tenant AOAI deployments / provisioned throughput for isolation SKUs.
- Breaker scoping that does not fail-closed all tenants for one tenant’s storm (trade-offs with blast radius).
