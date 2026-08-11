> **Scope:** Contributor-reference — mature LLM cost-control plane beyond budget gates (TB-1287); not a buyer-facing trust claim.

# Mature LLM cost-control plane beyond budget gates (TB-1287)

**Status:** Active (V1)  
**Backlog:** **TB-1287** (this contract) · **TB-1288** (anti-gates-alone / call-site-enough / SDK-bypass / stale-$50 honesty CI — open)  
**Audience:** Principal architects, FinOps reviewers, platform reviewers, coding agents  
**Related:** [INV004_RESERVE_SETTLE_LIFECYCLE_CONTRACT.md](./INV004_RESERVE_SETTLE_LIFECYCLE_CONTRACT.md) (**TB-975** / **TB-976** open / **TB-977** Done) · [OPERATIONS_LLM_QUOTA.md](./OPERATIONS_LLM_QUOTA.md) · [GOLDEN_COHORT_BUDGET.md](../runbooks/GOLDEN_COHORT_BUDGET.md) · ADR [0005](../architecture/adrs/0005-llm-cost-guardrails.md) · GTM **M-225** / **M-226** / **M-131** / **M-170** · Done **TB-011** / **TB-894** / **TB-939** · open **TB-941** / **TB-976** / **TB-1020**

---

## 1. Purpose

Name what a **mature LLM cost-control plane** adds beyond warn/kill + monthly/daily budget **gates** — and where **token accounting must live** so a new completion call site cannot bypass admission, metering, and reserve/settle without a deliberate exemption.

**One line:** **Gates cap admission; the mature plane is decorator-chokepoint accounting plus durable leases, run caps, spend reducers, showback, and process≠provider honesty — not warn/kill + monthly cap alone.**

---

## 2. Non-claims (say first)

| Do **not** claim | Why |
|------------------|-----|
| “Warn/kill + monthly cap = mature LLM FinOps.” | Cohort Cost Management probe + product `LlmMonthlyTenantDollarBudgetTracker` are **gates** — necessary, not the full plane (**M-225**). |
| “Reserving at a handler call site is enough.” | Call-site reserve without DI `LlmCompletionAccountingClient` does not stop a **new** code path from constructing a wire client and skipping accounting. |
| “Any host may call the Azure OpenAI SDK directly.” | Product hosts must inject `IAgentCompletionClient` / `IAgentStreamingCompletionClient` only; wire clients are host-registration factories (**TB-1288**). |
| “Cohort cap is still $50/month.” | Owner lowered cohort hard cap to **$15** on 2026-06-06 (`tests/golden-cohort/budget.config.json`); ratios **80% warn / 95% kill** remain pinned. |
| “Cohort ledger = product tenant ledger.” | Golden-cohort live harness uses Cost Management + append-only usage ledger; product uses INV-004 SQL trackers — label exemptions, do not elide. |
| “Metering = Azure invoice.” | `IUsageMeteringService` / cost reporting are **showback** estimates — provider billing is **M-170** / **TB-1020**. |

---

## 3. Shipped gates (cite — do not re-author)

These controls are **Done** or documented elsewhere. This contract **names** them as gate layers only.

| Gate | What it does | Canonical doc / code | TB |
|------|--------------|------------------------|-----|
| Cohort Cost Management probe + warn/kill | MTD ActualCost vs cap; nightly real-LLM eligibility | [`GOLDEN_COHORT_BUDGET.md`](../runbooks/GOLDEN_COHORT_BUDGET.md), `scripts/golden_cohort_budget_probe.py`, `assert_golden_cohort_kill_switch_present.py` | cohort ops |
| Product monthly USD hard cap | `LlmMonthlyTenantDollarBudgetTracker` reserve/settle on SQL row | [`INV004_RESERVE_SETTLE_LIFECYCLE_CONTRACT.md`](./INV004_RESERVE_SETTLE_LIFECYCLE_CONTRACT.md) | **TB-011** Done, **TB-975** |
| Product daily token window | `LlmDailyTenantBudgetTracker` | `OPERATIONS_LLM_QUOTA.md` | Done |
| Run-scoped batch admit | `IRunScopedLlmBudgetReservationService.AdmitBeforeAgentBatchAsync` before agent batch | INV-004 §6 | **TB-939** Done |
| Quick Scan global reservation | Per-attempt `Guid` + TTL + commit/release | INV-004 §5 | **TB-894** Done |
| SQL-owned UTC month period + in-flight fairness | Monthly period via `SYSUTCDATETIME()`; admission gate | INV-004 §7 | **TB-977** Done |

**Cohort cap pin (owner):** `monthlyTokenBudgetUsd` = **15** USD; `warnThresholdPercent` = **80**; `killSwitchThresholdPercent` = **95** in [`tests/golden-cohort/budget.config.json`](../../tests/golden-cohort/budget.config.json). Do not re-assert **$50** in buyer or PA copy.

---

## 4. Beyond gates — mature plane matrix

| Plane layer | Role | Not sufficient alone | Owner / residual |
|-------------|------|----------------------|------------------|
| **(1) Single accounting chokepoint** | All product completions (agents, Ask, judges, remediation, batch adapters) enter via DI-decorated `LlmCompletionAccountingClient` → inner wire client | Handler-level reserve without decorator | **TB-1288** CI; NetArch forbid list (design anchor below) |
| **(2) Durable reservation lifecycle** | Reserve before call, settle after; pooled monthly counter today | Crash-proof settle; orphan reclaim | **TB-976** open; **TB-977** Done (period + fairness) |
| **(3) Run / task spend caps** | Per-run USD/token ceilings; partial-run semantics | Monthly gate alone | **TB-941** open (per-step hard cap); **TB-937** Done (partial UX) |
| **(4) Cache admission + tier routing** | Reduce duplicate provider calls; route to cheaper tier | Substitute for hard gates or accounting | Done cache paths; tier routing as spend **reducer** |
| **(5) Attribution / showback** | `IUsageMeteringService`, operator cost views, OTel counters | Azure invoice reconciliation | **M-294** / **M-295**; **TB-1020** process≠provider |
| **(6) Process ≠ provider billing** | Skip after persist vs provider at-least-once | Zero duplicate provider spend | **M-170** / **TB-1020** |
| **(7) Embeddings / non-chat paths** | Explicit in or out of same plane | Assume all LLM spend is funneled if not listed | Document exemptions per path (see §6) |

---

## 5. Gates vs mature plane — summary matrix

| Question | Gates answer | Mature plane adds |
|----------|--------------|-------------------|
| Can we stop runaway cohort nightly spend? | Yes — Cost Management + kill at 95% | Chokepoint accounting for **product** paths; cohort harness exemption labeled |
| Can concurrent replicas bypass tenant hard cap? | Yes — INV-004 CAS (**TB-011** / **TB-975**) | Orphan reserved pressure until **TB-976**; fairness gate (**TB-977**) |
| Can a new feature silently add LLM spend? | **No** — gates alone do not see unknown call sites | **Yes** — require `IAgentCompletionClient` injection through `LlmCompletionAccountingClient` |
| Do we know who spent what? | Partial — product metering hooks at decorator | Showback + attribution distinct from kill |
| Is product spend = Azure bill? | **No** | Process skip vs provider billing (**M-170**) |

---

## 6. Non-bypass pin — accounting chokepoint

### 6.1 Decorator chain (product hosts)

| Rule | V1 intent |
|------|-----------|
| **Inject** | `IAgentCompletionClient` / `IAgentStreamingCompletionClient` from DI — never `new AzureOpenAiCompletionClient` in feature code |
| **Chokepoint** | `LlmCompletionAccountingClient` (`ArchLucid.AgentRuntime/LlmCompletionAccountingClient.cs`) wraps inner client (typically `AzureOpenAiCompletionClient`) |
| **Responsibilities at chokepoint** | Per-tenant quota windows, monthly/daily budget reserve/settle, `IUsageMeteringService` recording, prompt redaction hooks, OTel counters, `IAiBudgetPreCallGuard`, demo prompt cache |
| **Registration** | `ServiceCollectionExtensions.AgentsGovernanceRetrieval.cs` — wire clients are singleton factories; decorators are scoped |

ADR **0005** names guardrails at this layer. [`OPERATIONS_LLM_QUOTA.md`](./OPERATIONS_LLM_QUOTA.md) documents operator quota surfaces fed from the same path.

### 6.2 NetArch / factory-only construction (design anchor for **TB-1288**)

| Forbid in product feature assemblies | Allow in host composition only |
|----------------------------------------|--------------------------------|
| `new AzureOpenAiCompletionClient(...)` | Host `ServiceCollectionExtensions` registration |
| Direct Azure OpenAI SDK client construction for completions | Test fakes / simulator hosts with explicit test registration |
| Bypassing `LlmCompletionAccountingClient` for “just one quick call” | Golden-cohort **live** harness paths that use Cost Management ledger (labeled exemption) |

**Residual:** NetArchTest forbid list may ship in **TB-1288** or a follow-on named in **TB-1287** acceptance — this contract is the **design SoT** either way.

### 6.3 Labelled exemptions (not identical planes)

| Path | Budget / accounting plane | Label in copy |
|------|----------------------------|---------------|
| Product authenticated LLM completions | `LlmCompletionAccountingClient` + INV-004 trackers | Product ledger |
| Golden-cohort real-LLM nightly | Cost Management probe + cohort usage ledger | Cohort gate — not product `LlmMonthlyTenantDollarBudgetTracker` |
| Anonymous Quick Scan | `IQuickScanGlobalBudgetReservationStore` (**TB-894**) | Marketing plane — not paying-tenant monthly row |
| Simulator / test hosts | Test doubles or explicit simulator registration | Non-production |

---

## 7. Code anchors (verification)

| Surface | Location |
|---------|----------|
| Accounting decorator | `ArchLucid.AgentRuntime/LlmCompletionAccountingClient.cs` |
| Monthly tracker | `ArchLucid.AgentRuntime/LlmMonthlyTenantDollarBudgetTracker.cs` |
| Daily token tracker | `ArchLucid.AgentRuntime/LlmDailyTenantBudgetTracker.cs` |
| Run-scoped admit | `RunScopedLlmBudgetReservationService` (**TB-939**) |
| Metering | `IUsageMeteringService` / `ArchLucidInstrumentation` LLM counters |
| Cohort cap config | `tests/golden-cohort/budget.config.json` |
| Cohort kill-switch CI | `scripts/ci/assert_golden_cohort_kill_switch_present.py` |
| Host wire registration | `ArchLucid.Host.Composition/Startup/ServiceCollectionExtensions.AgentsGovernanceRetrieval.cs` |

---

## 8. Operator / PA review

1. Trace one Real completion — confirm it crosses `LlmCompletionAccountingClient`, not a raw SDK call in a controller or agent handler.
2. Ask which assemblies are **forbidden** from constructing wire clients — answer must cite this contract + host registration, not “we only call OpenAI in one place today.”
3. Separate **cohort $15** language from **product tenant monthly cap** — different probes and ledgers.
4. Ask what happens after crash between reserve and settle — cite **TB-976**, not “automatic release” ([INV-004](./INV004_RESERVE_SETTLE_LIFECYCLE_CONTRACT.md)).
5. Treat “caps alone = mature FinOps,” “call-site reserve prevents bypass,” or “$50 cohort cap” as review findings (**M-225**).

---

## 9. Claim boundary (GTM **M-225** / **M-226**)

| Safe | Unsafe |
|------|--------|
| “Accounting lives at the DI decorator chokepoint (`LlmCompletionAccountingClient`).” | “Warn/kill + monthly cap alone are mature FinOps.” |
| “Gates plus leases, run caps, cache/tier, showback, process≠provider.” | “Reserving in the handler prevents bypass by new call sites.” |
| “Cohort hard cap is **$15** (owner 2026-06-06); ratios 80/95 pinned.” | “Cohort cap is $50/month.” |
| “Metering supports operator showback; reconcile separately from Azure invoice.” | “Metering equals the Azure bill.” |
| “Cohort and product ledgers use different planes — label exemptions.” | “Cohort gate proves product ledger behavior.” |

Buyer handout: [BUYER_SECURITY_PROCUREMENT_PACKET.md § M-226](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#llm-cost-control-plane-m-226). Path-stable alias: [LLM_COST_CONTROL_PLANE_PA_ONE_PAGER.md](../go-to-market/LLM_COST_CONTROL_PLANE_PA_ONE_PAGER.md).

---

## 10. Enforcement surfaces (**TB-1288** CI anchors)

| Guard | Intent | Verification points |
|-------|--------|---------------------|
| Gates-alone FinOps | Fail stubs equating warn/kill + monthly cap with complete cost-control architecture without naming chokepoint + beyond-gate controls | This contract §3–§4 |
| Call-site reserve enough | Fail claims that handler reserve/settle prevents bypass without `LlmCompletionAccountingClient` | §6.1 |
| SDK bypass approved | Fail claims that wire/SDK construction outside host registration is an approved product pattern | §6.2 |
| Stale **$50** cohort cap | Fail cohort-cap claims contradicting `GOLDEN_COHORT_BUDGET.md` / `budget.config.json` | §3 cohort pin |
| Wiring | Pair **M-225**; wire in `run_buyer_surface_strict_guards.py` | `LlmCompletionAccountingClient`, ADR 0005, `assert_golden_cohort_kill_switch_present.py`, INV-004 trackers, `IUsageMeteringService` |

**TB-1288** implements the guards; **TB-1287** does **not** reopen Done **TB-011** or implement **TB-976**.

---

## 11. Related backlog (do not collapse)

| ID | Relationship |
|----|--------------|
| **TB-975** | Reserve/settle lifecycle — complements; does not replace mature-plane matrix |
| **TB-976** | Durable per-reservation leases + orphan reclaim |
| **TB-977** | **Done** — SQL UTC month period + in-flight admission fairness |
| **TB-939** | Run-scoped batch admit (gate, not chokepoint) |
| **TB-941** | Per-run / per-step hard caps (open) |
| **TB-1020** | Process vs provider billing honesty |
| **TB-1288** | Honesty CI for this contract |
| **M-225** / **M-226** | GTM claim boundary + PA one-pager |

---

## 12. Explicit non-goals

- Implementing durable leases (**TB-976**) or raising/lowering cohort USD cap (owner PR only).
- Provider refunds or wallet overage semantics (**TB-014**).
- Reopening Done **TB-011** / **TB-894** / **TB-939** implementations.
- NetArch forbid-list **implementation** (may ship with **TB-1288**).
