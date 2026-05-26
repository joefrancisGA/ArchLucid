> **Scope:** Contributor-reference — Per-tenant and host-level LLM cost **estimation** methodology (not billing invoices).

# Per-tenant cost model (estimation)

This document describes how ArchLucid **approximates** Azure OpenAI spend for operators and FinOps workflows. It is **not** a substitute for Azure Cost Management + invoice reconciliation.

## Host-level rates (`AgentExecution:LlmCostEstimation`)

Runtime cost estimates use `ILlmCostEstimator`, which applies USD-per-million rates from configuration:

- `AgentExecution:LlmCostEstimation:InputUsdPerMillionTokens`
- `AgentExecution:LlmCostEstimation:OutputUsdPerMillionTokens`

When `AgentExecution:LlmCostEstimation:Enabled` is `false`, the estimator returns no USD value (previews show a null estimate).

Note: Cost aggregations (like `AgentExecutionTraceRunLlmCostAggregator`) re-estimate costs using live rates rather than strictly summing historical point-in-time estimates.

## Wizard preview (`GET /v1/agent-execution/cost-preview`)

The operator **new-run wizard** review step calls this endpoint to show an **illustrative upper bound** before `POST /v1/architecture/request`. The `cost-preview` remains purely estimated until live LLM token metrics (e.g., `archlucid.llm.completion_tokens` from `LlmCompletionAccountingClient`) are fully integrated into a real-time spend ledger:

- **Mode:** `AgentExecution:Mode` — the preview card is **hidden** when the host is `Simulator`.
- **Cap:** effective `AzureOpenAI:MaxCompletionTokens` (or the default **4096** when unset/zero).
- **Tokens assumed:** a single completion scenario with **8192** assumed input (prompt + system context order-of-magnitude) and **max completion** output tokens, both passed to `ILlmCostEstimator.EstimateUsd`. Actual runs vary with agents, retries, and tool traffic — treat the figure as **order-of-magnitude**, not a quote.

## Golden Cohort Token Distribution

Based on recent nightly golden-cohort metrics, the observed token distribution ranges for `archlucid.llm.completion_tokens` are:
- **p50:** ~850 tokens per completion (e.g., typical topology synthesis or compliance evaluations).
- **p95:** ~2,400 tokens per completion (e.g., dense cost estimation payload or elaborate critic reviews).

## Per-tenant dashboards

Aggregated tenant spend, budgets, and anomaly detection are **out of scope** for this file; see [`CAPACITY_AND_COST_PLAYBOOK.md`](CAPACITY_AND_COST_PLAYBOOK.md) for operational capacity guidance.

## Hosted signup trials — forecasting appendix (2026‑05‑11)

The **hosted self‑serve trial** path uses **`LlmMonthlyTenantDollarBudget`** when enabled (see **`LlmMonthlyTenantDollarBudgetOptions`** and SaaS overlays in **`appsettings.SaaS.json`**). Operational **\$ / trial‑month envelopes**, mini vs full **GPT‑class** multiples, **`AgentExecution:Mode=Real`** expectations, **`MaxCompletionTokens`** guidance, tier‑scoped **\$25/\$35** tightening once Free‑tier binds exist, SQL elastic‑pool caveat, idle early read‑only backlog reco, plus example fleet math live in [`TRIAL_AND_SIGNUP.md`](../go-to-market/TRIAL_AND_SIGNUP.md) (**sections 3.1–3.2**).
