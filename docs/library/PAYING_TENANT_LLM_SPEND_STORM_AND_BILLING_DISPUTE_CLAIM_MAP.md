> **Scope:** Contributor-reference claim map for engineering and principal-architect diligence; not a buyer brochure.

# Paying-tenant LLM spend storm + metering vs Azure OpenAI billing

**Audience:** Engineering, security reviewers, principal-architect diligence. Not a buyer brochure.

**Status:** **Done** (2026-08-11) for **TB-1570** / GTM **M-294**. Pair honesty CI **TB-1571** / **M-294** (open).

**Verdict (one line):** Paying tenants are **not** unbounded like anonymous Quick Scan — layered **HTTP / token / (optional) monthly estimated-USD / run-admit** gates fail-closed on further Real completions — but a **compromised API key can burn the tenant’s remaining headroom until revoke**, and product **AI metering is estimated tokens/USD, not dispute-grade reconciliation to Azure OpenAI invoices**.

---

## 1. What stops a paying-tenant / stolen-key spend storm

| Control | Scope | Exceeded | Per API key? |
|---------|--------|----------|--------------|
| HTTP fixed-window rate limit | Authenticated: `tenant_id` | HTTP 429 | **No** — tenant bucket |
| `LlmTokenQuota` (Prod on) | Sliding window tokens | Fail-closed | No |
| `LlmDailyTenantBudget` (Prod on) | UTC-day tokens | Fail-closed | No |
| `LlmMonthlyTenantDollarBudget` (INV-004) | UTC-month **estimated** USD | Fail-closed (when enabled) | No — **on in SaaS overlay; default off in Production.json** |
| `AiBudgetPreCallGuard` / run-scoped reservation | Workspace / run admit | Fail-closed when hard-stop | No |
| Per-run `MaxTokensPerRun` / `MaxCostPerRun` | Architecture run | CostLimit / partial | No |
| Polly + circuit breaker | Provider transport | Rejects on open | N/A — **not** a spend cap |
| Azure RG consumption budget (TF) | Resource group AOAI | **Email notify** | Does **not** hard-stop product LLM |
| Quick Scan global USD reserve | Anonymous marketing | Fail-closed | **Different plane** (Done **TB-892+**) |

**Compromised API key:** Full tenant principal until removed from config (`IOptionsMonitor` — next request fail-closed after reload; in-flight may still complete — **TB-1537** / **M-282**). Can spend up to **tenant** quotas/budgets (and AOAI TPM). **Not** unbounded forever; **not** per-key spend isolation.

**Chokepoint:** `LlmCompletionAccountingClient` → daily/monthly trackers + `IAiBudgetPreCallGuard` + optional `IUsageMeteringService` (ADR 0005). Residual bypass / maturity = open **TB-1287** / **M-225**.

---

## 2. Metering vs Azure OpenAI billing (dispute readiness)

| Question | Finding |
|----------|---------|
| What does ArchLucid meter? | Provider **token counts**; **estimated USD** from configured `$/M` rates (`ILlmCostEstimator`); optional usage events / admin showback; `archlucid.llm.cost_delta` telemetry |
| Automated invoice reconcile? | **No** product pipeline tenant ledger ↔ Azure Cost Management / invoice lines |
| Eng evidence? | `docs/evidence/LLM_COST_RECONCILIATION.md` + cost query scripts — **manual / incomplete**; Cost Management lag 24–48h+ |
| Estimator honesty | Defaults can **under-estimate** list rates; negotiated rates ≠ product config |
| Dispute-grade export? | Showback + traces + SQL budget state — **not** signed per-tenant export keyed to Azure meter IDs |
| Docs already pin | Product figures are **estimates ≠ invoiced Azure OpenAI** (`API_CONTRACTS.md`) |

---

## 3. Too-strong vs safe

| Too strong | Safe |
|------------|------|
| “Paying tenants / API keys cannot create an LLM spend storm” | Authenticated Real LLM gated by tenant HTTP rate limits, sliding/daily token quotas, and (when enabled) monthly estimated-USD hard cutoff |
| “A stolen API key cannot burn money” | Stolen key can spend until tenant budgets trip or the key is removed; revoke is next-request fail-closed after config reload |
| “Budget gates = mature FinOps / abuse-proof” | Gates + SQL INV-004 block multi-replica hard-cap bypass; crash orphans, assumed-max soft-DoS, decorator bypass remain (**M-225** / **M-131**) |
| “Product AI usage = Azure OpenAI bill” | Product figures are **estimated** from tokens × configured rates; reconcile to Azure Cost Management / invoice for money truth |
| “We have automated billing-dispute reconciliation” | Operators have showback + manual evidence procedure; automated invoice match is **not** shipped |
| “Azure consumption budget hard-stops LLM” | RG budget notifies contacts; product hard-stop is app quota/budget when enabled |
| Conflate Quick Scan anonymous safety with paid tenants | Quick Scan has its own global reservation plane; paying tenants use tenant quotas/budgets |
| “Monthly USD budget always on in Production” | Enabled in SaaS overlay; Production.json defaults leave monthly dollar budget **off** unless overridden |

---

## 4. Related owners (orchestrate — do not duplicate)

| ID | Role |
|----|------|
| Open **TB-1287** / **TB-1288**, **M-225** / **M-226** | Mature cost-control plane + chokepoint honesty |
| Done **TB-975**/**TB-976**/**TB-977**; **M-131** / **M-132** | INV-004 reserve/settle lifecycle contract |
| Done **TB-011** / **INV-004**, Done **TB-939** | Multi-replica budget + run-scoped admit |
| Open **TB-1020**–**TB-1021**, **M-170** / **M-171** | Process vs provider billing / rebill |
| Open **TB-1299**–**TB-1300**, **M-229** / **M-230** | AOAI 429 execute policy (adjacent) |
| Done **TB-892**–**TB-896** | Anonymous Quick Scan — **contrast only** |
| Done **TB-1537** / **M-282** | API key revoke timing — [`MID_RUN_AUTHORITY_REVOCATION_CLAIM_MAP.md`](MID_RUN_AUTHORITY_REVOCATION_CLAIM_MAP.md) |
| **TB-1570** / **M-294** | This paying-tenant spend-storm + dispute claim map |

---

## 5. Optional follow-ons (not required to close honesty pin)

- Per-API-key spend / rate isolation (beyond tenant bucket).
- Automated Cost Management ↔ product ledger reconcile job + signed dispute export.
- Force `LlmMonthlyTenantDollarBudget` on in all paid Production overlays.
- Close eng evidence cohort tables in `LLM_COST_RECONCILIATION.md`.
