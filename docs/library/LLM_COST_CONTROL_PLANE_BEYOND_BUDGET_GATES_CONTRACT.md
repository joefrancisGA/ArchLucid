> **Scope:** Contributor-reference — mature LLM cost-control plane beyond budget gates + non-bypassable accounting chokepoint (**TB-1287**); not a buyer assurance attestation.

# Mature LLM cost-control plane beyond budget gates

**Status:** Active (V1)  
**Backlog:** **TB-1287** (this contract) · **TB-1288** **Done** (anti-gates-alone / call-site-reserve-enough / SDK-bypass / stale-$50 honesty CI)  
**Audience:** Principal architects, FinOps reviewers, platform reviewers, coding agents  
**Related:** [ARCHITECTURE_INVARIANTS.md](./ARCHITECTURE_INVARIANTS.md) (**INV-004**) · [INV004_RESERVE_SETTLE_LIFECYCLE_CONTRACT.md](./INV004_RESERVE_SETTLE_LIFECYCLE_CONTRACT.md) (**TB-975**) · [OPERATIONS_LLM_QUOTA.md](./OPERATIONS_LLM_QUOTA.md) · [../runbooks/GOLDEN_COHORT_BUDGET.md](../runbooks/GOLDEN_COHORT_BUDGET.md) · ADR [0005](../architecture/adrs/0005-llm-cost-guardrails.md) · GTM **M-225** / **M-226** / **M-131** / **M-170** · Done **TB-011** / **TB-894** / **TB-939** · open **TB-976** / **TB-941** / **TB-1020**

**Buyer / PA one-pager:** [`BUYER_SECURITY_PROCUREMENT_PACKET.md` § M-226](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#llm-cost-control-plane-m-226).  
**Path-stable alias:** [`LLM_COST_CONTROL_PLANE_PA_ONE_PAGER.md`](../go-to-market/LLM_COST_CONTROL_PLANE_PA_ONE_PAGER.md).

---

## 1. Purpose

Name what **budget gates alone** cover versus what a **mature LLM cost-control plane** adds — and where token accounting must live so new call sites cannot bypass product admission, metering, and reserve/settle.

**One line:** **Gates admit or deny**; **the decorator chokepoint accounts**; **leases, run caps, cache/tier, and showback** complete the plane — warn/kill + monthly cap is necessary but not sufficient.

---

## 2. Non-claims (say first)

| Do **not** claim | Why |
|------------------|-----|
| “Warn/kill + monthly cap = mature FinOps.” | Cohort/product gates are admission layers only — not a complete cost-control architecture without chokepoint accounting and beyond-gate controls. |
| “Call-site reserve is enough.” | Reserving at one handler does not prevent a new completion path from constructing a wire client outside the DI decorator chain. |
| “Any host may call Azure OpenAI SDK directly.” | Product hosts must inject `IAgentCompletionClient` / `IAgentStreamingCompletionClient` and receive `LlmCompletionAccountingClient` from DI — not `new AzureOpenAiCompletionClient`. |
| “Cohort cap is still **$50**/month.” | Owner lowered to **$15** on 2026-06-06 in `tests/golden-cohort/budget.config.json`; warn **80%** / kill **95%** ratios remain pinned. |
| “Metering = Azure invoice.” | `IUsageMeteringService` showback is estimated tokens/USD — dispute-grade reconcile is **TB-1020** / **M-170**, not this contract. |
| “Gates alone prevent SDK bypass.” | Bypass prevention is DI registration + architecture-test forbid list — not monthly/daily counters. |

---

## 3. Shipped gates (cite — do not re-author)

| Gate | Scope | Owner / anchor |
|------|-------|----------------|
| Golden-cohort Cost Management probe + warn/kill + append-only ledger | Live eval / cohort Azure spend | [`GOLDEN_COHORT_BUDGET.md`](../runbooks/GOLDEN_COHORT_BUDGET.md); `tests/golden-cohort/budget.config.json` (**$15** cap) |
| `LlmMonthlyTenantDollarBudgetTracker` / `LlmDailyTenantBudgetTracker` | Authenticated tenant estimated USD / UTC-day tokens | **INV-004** / **TB-975**–**TB-977**; [`INV004_RESERVE_SETTLE_LIFECYCLE_CONTRACT.md`](./INV004_RESERVE_SETTLE_LIFECYCLE_CONTRACT.md) |
| `LlmTokenQuotaWindowTracker` | Sliding-window token quota (Prod on) | [`OPERATIONS_LLM_QUOTA.md`](./OPERATIONS_LLM_QUOTA.md); ADR 0005 |
| Run-scoped batch admit | Before `IAgentExecutor.ExecuteAsync` | **TB-939** Done — `IRunScopedLlmBudgetReservationService` |
| Quick Scan reservation | Anonymous marketing plane | **TB-894** Done — per-reservation `Guid` + TTL |
| HTTP fixed-window rate limit | Authenticated tenant bucket | Layer in paying-tenant spend map (**TB-1570**) |

**Cohort vs product ledger:** Golden-cohort live harness may use Cost Management ledger instead of the product monthly tracker — label the plane; do not pretend they are identical.

---

## 4. Beyond gates — mature plane layers

| # | Layer | Role | Not sufficient alone |
|---|-------|------|----------------------|
| 1 | **Accounting chokepoint** (`LlmCompletionAccountingClient`) | Single DI decorator on `IAgentCompletionClient` / `IAgentStreamingCompletionClient`: quota, daily/monthly reserve/settle, redaction hooks, OTel, `IUsageMeteringService`, `IAiBudgetPreCallGuard` | Call-site reserve without DI |
| 2 | **Durable reservation lifecycle** | Pooled monthly/daily counter + SQL `ROWVERSION` CAS; per-call leases + orphan reclaim (**TB-976** open) | Crash-proof settle (**M-132**) |
| 3 | **Run / task spend caps** | Run-scoped admit (**TB-939**); per-step hard cap residual (**TB-941** open); partial-run semantics (**TB-937** Done) | Transport Polly success |
| 4 | **Cache / tier routing** | Spend reducers — demo prompt cache, mode/tier routing, prompt-cache prefix stability (**TB-2159**) | Substitute for hard kill or accounting |
| 5 | **Attribution / showback** | Operator-visible estimated usage (`IUsageMeteringService`, cost reporting) | Azure invoice reconciliation |
| 6 | **Process ≠ provider** | TaskId process skip after persist; provider at-least-once | Zero duplicate provider spend (**M-171** / **TB-1020**) |
| 7 | **Embeddings / non-chat** | Must be explicitly in or out of the same plane | Assume parity without contract |

**Code anchor:** `ArchLucid.AgentRuntime/LlmCompletionAccountingClient.cs` — all agent completions, Ask, judges, remediation, and batch adapters that bill product hosts should enter through this decorator (ADR 0005).

---

## 5. Non-bypass pin

| Rule | V1 intent |
|------|-----------|
| **Inject, don't construct** | Product hosts register `IAgentCompletionClient` → `LlmCompletionAccountingClient` → inner wire client in DI only. |
| **Forbid direct SDK** | NetArchTest / factory-only construction — forbid `new AzureOpenAiCompletionClient` (and raw Azure OpenAI SDK clients) outside host registration. |
| **New call sites** | Must take `IAgentCompletionClient` or `IAgentStreamingCompletionClient` from DI — never a wire type. |
| **Residual exemptions** | Golden-cohort live harness (Cost Management ledger); unit/integration tests with explicit test doubles — label, don't generalize to product hosts. |

**TB-1288** **Done** — CI/doc guards fail gates-alone, call-site-enough, SDK-bypass, and stale-**$50** claims. NetArch forbid-list implementation may ship in a follow-on slice named there.

---

## 6. Cohort cap pin ($15)

| Field | Value | Source |
|-------|-------|--------|
| `monthlyTokenBudgetUsd` | **15** | `tests/golden-cohort/budget.config.json` |
| `warnThresholdPercent` | **80** | same |
| `killSwitchThresholdPercent` | **95** | same |
| Prior owner cap | **$50** (retired 2026-06-06) | Do not re-assert in buyer/PA copy |

---

## 7. Cross-links (orchestration)

| ID | Relationship |
|----|--------------|
| **TB-975** / **TB-976** / **TB-977** | Reserve/settle lifecycle — gates 2 and 3; **TB-977** Done |
| **TB-939** | Run-scoped admit before agent batch |
| **TB-941** | Per-step hard cap (open) |
| **TB-1020** / **M-170** | Process vs provider idempotency |
| **TB-1570** | Paying-tenant spend storm — orchestrates, does not duplicate this matrix |
| **M-225** | Claim honesty — do not overclaim gates |
| **M-226** | PA one-pager — buyer-safe summary |

---

## 8. Code / doc anchors

| Surface | Path |
|---------|------|
| Accounting decorator | `ArchLucid.AgentRuntime/LlmCompletionAccountingClient.cs` |
| Monthly USD tracker | `ArchLucid.AgentRuntime/LlmMonthlyTenantDollarBudgetTracker.cs` |
| Daily token tracker | `ArchLucid.AgentRuntime/LlmDailyTenantBudgetTracker.cs` |
| Run-scoped admit | `RunScopedLlmBudgetReservationService` |
| Cohort budget config | `tests/golden-cohort/budget.config.json` |
| Cohort kill-switch CI | `assert_golden_cohort_kill_switch_present.py` |
| ADR | `docs/architecture/adrs/0005-llm-cost-guardrails.md` |

---

## 9. PA review drill

1. Trace a Real completion — confirm it crosses `LlmCompletionAccountingClient`, not a raw SDK client.
2. Ask which product hosts are forbidden from constructing wire clients outside DI.
3. Separate cohort **$15** budget language from product monthly ledger claims.
4. Treat “caps alone = mature FinOps,” “call-site reserve prevents bypass,” or “metering = Azure invoice” as review findings.
5. Ask which paths (embeddings, batch adapters, judges) are in vs out of the chokepoint — answer must cite this contract.

---

## 10. Claim boundary (GTM **M-225** / **M-226**)

| Safe (buyer / GTM) | Too strong |
|--------------------|------------|
| Accounting lives at the DI decorator chokepoint | Warn/kill + monthly cap alone are mature FinOps |
| Gates + leases + run caps + cache/tier + showback form the plane | Call-site reserve prevents bypass by new paths |
| Cohort cap is **$15** (owner pin since 2026-06-06) | Stale **$50**/month cohort cap |
| Product metering is estimated showback | Metering equals Azure OpenAI invoice |

Canonical buyer handout: [`BUYER_SECURITY_PROCUREMENT_PACKET.md` § M-226](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#llm-cost-control-plane-m-226). Reserve/settle residuals: [`INV004_RESERVE_SETTLE_LIFECYCLE_CONTRACT.md`](./INV004_RESERVE_SETTLE_LIFECYCLE_CONTRACT.md) (**M-131** / **M-132**).

---

## 11. CI anchors for **TB-1288**

| Guard | Must fail |
|-------|-----------|
| Gates-alone FinOps | Stubs equating warn/kill + monthly cap with complete LLM cost-control architecture without naming chokepoint + beyond-gate controls |
| Call-site reserve enough | Claims that handler-level reserve/settle prevents bypass without `LlmCompletionAccountingClient` |
| Direct SDK bypass | Claims that constructing wire/SDK clients outside the registered decorator chain is approved for product hosts |
| Stale cohort cap | **$50**/month cohort-cap claims contradicting `GOLDEN_COHORT_BUDGET.md` / `budget.config.json` |

Wire into `run_buyer_surface_strict_guards.py` per **TB-1288** **Done**. Pair **M-225** Verification anchors: `LlmCompletionAccountingClient`, ADR 0005, `assert_golden_cohort_kill_switch_present.py`, INV-004 trackers, `IUsageMeteringService`.

---

## 12. Out of scope

- Implementing durable per-call leases (**TB-976**) — cited, not closed here.
- Raising/lowering cohort USD cap — owner PR to `budget.config.json` only.
- Provider refunds for in-flight completions.
- Reopening Done **TB-011** / **TB-039** / **TB-894**.
- Automated Azure Cost Management ↔ product invoice reconcile (**TB-1020** pipeline).
