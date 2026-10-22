> **Scope:** Contributor-reference — Operations — LLM token quota and metrics - full detail, tables, and links in the sections below.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).


# Operations — LLM token quota and metrics

**Last reviewed:** 2026-07-24

## Configuration

| Key | Purpose |
|-----|---------|
| `LlmTokenQuota:Enabled` | Turn on sliding-window per-tenant limits. |
| `LlmTokenQuota:WindowMinutes` | Window length (1–1440). |
| `LlmTokenQuota:MaxPromptTokensPerTenantPerWindow` | Cap on **input** tokens summed in the window (0 = unlimited). |
| `LlmTokenQuota:MaxCompletionTokensPerTenantPerWindow` | Cap on **output** tokens summed in the window (0 = unlimited). |
| `LlmTokenQuota:AssumedMaxPromptTokensPerRequest` | Pre-flight guard before usage is known. |
| `LlmTokenQuota:AssumedMaxCompletionTokensPerRequest` | Pre-flight guard before usage is known. |
| `LlmMonthlyTenantDollarBudget:Enabled` | Turn on UTC-month **estimated USD** limits per tenant (requires **`AgentExecution:LlmCostEstimation`** with **positive** USD/M rates). |
| `LlmMonthlyTenantDollarBudget:IncludedUsdPerUtcMonth` | “Included” band; warn fires at `IncludedUsdPerUtcMonth * WarnFraction`. |
| `LlmMonthlyTenantDollarBudget:HardCutoffUsdPerUtcMonth` | Block real-mode completions when **cumulative estimated USD** this UTC month would exceed this value (pre-call uses assumed token upper bounds). |
| `LlmMonthlyTenantDollarBudget:WarnFraction` | Fraction of **included** USD at which **`LlmTenantMonthlyDollarBudgetApproaching`** is logged (once per tenant per UTC month). |
| `LlmMonthlyTenantDollarBudget:AssumedMaxPromptTokensPerRequest` | Pre-flight USD reservation before usage returns. |
| `LlmMonthlyTenantDollarBudget:AssumedMaxCompletionTokensPerRequest` | Pre-flight USD reservation before usage returns. |
| `RunScopedLlmBudgetReservation:Enabled` | **TB-939** — admit-before-spend for architecture run agent batches (reserve/commit/release before Topology). Default **true**. When monthly USD budget is disabled, admission is a no-op after MaxCost/MaxTokens checks. |
| `RunScopedLlmBudgetReservation:AssumedCallsPerAgentTask` | Assumed provider calls per scheduled agent task when estimating batch USD (default **1**). |
| `RunScopedLlmBudgetReservation:ReservationTtlMinutes` | Pending reservation TTL before automatic expiry (default **120**). |
| `RunScopedLlmBudgetReservation:AccountingGracePercent` | Grace percent on monthly hard cap when summing pending run reservations + current pressure (default **2**). |
| `LlmTelemetry:RecordPerTenantTokens` | Emit Prometheus series with `tenant_id` label (raises cardinality — enable only for bounded tenant counts). |

### Run-scoped batch admission (TB-939)

Before `IAgentExecutor.ExecuteAsync` for a run, ArchLucid estimates batch USD as `taskCount × AssumedCallsPerAgentTask × assumedUsdPerCall`, rejects when the estimate exceeds `AgentOutputQualityGate:MaxCostPerRun` / `MaxTokensPerRun` (`costBudget`), then holds a **tenant-scoped pending reservation** against the monthly hard cap so concurrent executes cannot overspend. On success the reservation is **committed** (pending released); on cancel/fail it is **released**. Per-call INV-004 leases remain; this is an outer admit latch (does not replace `LlmCompletionAccountingClient`).

When quota is exceeded, the API returns **429** with problem type `#llm-token-quota-exceeded`. When the server can compute a retry instant (sliding-window expiry or next UTC-day budget boundary), the problem payload may include a **`retryAfterUtc`** extension (same shape as circuit-breaker **`retryAfterUtc`**). **Monthly dollar budget** uses **next UTC month start** for **`retryAfterUtc`** when the hard cutoff trips. OpenTelemetry counter **`archlucid_llm_quota_exceeded_total`** increments once per rejected pre-call (accounting decorator). Agent execution traces persist **`FailureReasonCode`=`LlmTokenQuotaExceeded`** when quota ends a handler.

## Metrics

- Aggregate (default): `archlucid_llm_prompt_tokens_total`, `archlucid_llm_completion_tokens_total` without tenant labels.
- Per-tenant (optional): same metric names **with** `tenant_id` label when `LlmTelemetry:RecordPerTenantTokens` is true.

Use Grafana dashboard **`infra/grafana/dashboard-archlucid-authority.json`** (LLM panels) and **`dashboard-archlucid-slo.json`** for HTTP latency objectives.

## FinOps

Combine these metrics with Azure Cost Management tags from Terraform (`finops_environment`, `finops_cost_center` in `infra/terraform-container-apps`).

## Admin COGS Dashboard

Admins can review internal fleet cost pressure at **Admin → Fleet LLM COGS** (`/admin/fleet-llm-cogs`) or through `GET /v1/admin/operational/fleet-llm-cogs`.

Use the dashboard as an **internal COGS estimate**, not an invoice or customer charge:

- **Estimated pressure** comes from `LlmMonthlyTenantBudgetState` for the current UTC month.
- **Hard cap** and **near-threshold** labels come from `LlmMonthlyTenantDollarBudget:*`.
- **Cost rates** are considered configured only when `AgentExecution:LlmCostEstimation` is enabled and positive input/output USD-per-million-token rates are present.
- **Budget completeness** values mean: `complete`, `near-threshold`, `hard-stop`, `monitoring-disabled`, or `missing-cost-rates`.

Operator response:

- `missing-cost-rates`: configure positive `AgentExecution:LlmCostEstimation:InputUsdPerMillionTokens` and `OutputUsdPerMillionTokens`, or a persisted admin rate override, before treating spend rollups as margin evidence.
- `monitoring-disabled`: monthly hard stops are not active; use this only for non-production or explicitly approved deployments.
- `near-threshold`: review tenant usage and top up budget only when the pilot/commercial agreement supports it.
- `hard-stop`: additional real-mode LLM execution is blocked for the tenant until the next UTC month or an approved cap bump.
