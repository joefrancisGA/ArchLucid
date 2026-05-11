> **Evidence:** LLM cost estimator vs Azure billing — dev AOAI resource (`oai-archlucid-dev`). Not legal/financial advice; numbers depend on subscription discounts, region, deployment SKU, and Cost Management latency.

## 1. Objective

Reconcile **`LlmCostEstimator`** USD output with:

1. **Token-derived estimates** recorded on **`AgentExecutionTrace`** rows (product telemetry path).
2. **Actual billed** Azure usage attributed to **`Microsoft.CognitiveServices/accounts/oai-archlucid-dev`** (Cost Management).

**Constraints respected:** no changes to **`LlmCostEstimator`** logic in this evidence pass — only measurement + configuration guidance.

### Evidence collection status (handoff)

| Acceptance item | Status |
|-----------------|--------|
| ≥ **5** real-mode golden cohort runs with captured **`estimatedUsd`** / tokens | **Not executed in-repo** — requires a running API host, **`ARCHLUCID_GOLDEN_COHORT_REAL_LLM`**, Azure OpenAI credentials, and budget approval (see **`docs/runbooks/GOLDEN_COHORT_REAL_LLM_GATE.md`**). **Section 3** table remains **`(pending)`**. |
| Cost Management actuals for **`oai-archlucid-dev`** | **`scripts/evidence/query-aoai-dev-resource-cost.ps1`** succeeds against subscription **`ArchLucid DEV`** but returned **`rows: []`** for the sampled UTC window (lag, filter shape, or zero attributed rows — confirm in Portal **Cost analysis**). **Section 4** billed USD **`(fill)`**. |
| Drift % vs billed **`A`** | **TBD** until cohort **`E`** and Portal **`A`** exist. |
| List-price proxy vs defaults | **Completed** — **Section 6** (official row cited below). |

## 2. Estimator reference (shipped code path)

`LlmCostEstimator.EstimateUsd` computes:

\[
\text{USD} = \frac{\text{inputTokens} \times r_{in}}{10^6} + \frac{\text{outputTokens} \times r_{out}}{10^6} + \frac{\text{reasoningTokens} \times r_{reason}}{10^6}
\]

- **`r_in`** / **`r_out`** default from **`AgentExecution:LlmCostEstimation:InputUsdPerMillionTokens`** / **`OutputUsdPerMillionTokens`** (`**LlmCostEstimationOptions**`).
- Optional **`Deployments`** dictionary overrides rates when **`AgentExecutionTrace.ModelDeploymentName`** matches a key (case-insensitive).

Defaults documented for operators (**`docs/library/CONFIGURATION_REFERENCE.md`**):

| Setting | Default |
|---------|---------|
| **`AgentExecution:LlmCostEstimation:Enabled`** | **true** |
| **`InputUsdPerMillionTokens`** | **0.5** USD / 1M prompt tokens |
| **`OutputUsdPerMillionTokens`** | **1.5** USD / 1M completion tokens |

Aggregates match **`AgentExecutionTraceRunLlmCostAggregator`** (sums per-trace slices).

## 3. Golden cohort capture procedure (real LLM, `gpt-4o`)

Canonical cohort definition: **`tests/golden-cohort/cohort.json`** (items **`gc-001`** … **`gc-020`**).

Operators must run **≥ 5** scenarios with **`ARCHLUCID_GOLDEN_COHORT_REAL_LLM=true`**, **`AgentExecution:Mode=Real`**, host **`AzureOpenAI`** wired to deployment **`gpt-4o`**, and **`AgentExecution:LlmCostEstimation:Enabled=true`** per **`docs/runbooks/GOLDEN_COHORT_REAL_LLM_GATE.md`** and **`tests/golden-cohort/README.md`** (budget approval).

### Per-run fields to record

| Column | Source |
|--------|--------|
| **`scenarioId`** | **`tests/golden-cohort/cohort.json`** → **`id`** |
| **`runId`** | Architecture run GUID returned by API |
| **`promptTokens`** | Sum **`AgentExecutionTrace.InputTokenCount`** for run |
| **`completionTokens`** | Sum **`AgentExecutionTrace.OutputTokenCount`** for run |
| **`estimatedUsd`** | Sum of trace **`EstimatedCostUsd`** **or** recompute with aggregator + same **`ILlmCostEstimator`** options as host |

Persist exporter JSON or SQL snapshot alongside this doc when completing full reconciliation.

### Scenario placeholder table (operator completion)

| scenarioId | runId | promptTokens | completionTokens | estimatedUsd (host) | Notes |
|------------|-------|----------------|------------------|---------------------|-------|
| gc-001 | *(pending)* | | | | |
| gc-002 | *(pending)* | | | | |
| gc-003 | *(pending)* | | | | |
| gc-004 | *(pending)* | | | | |
| gc-005 | *(pending)* | | | | |
| **Σ** | — | *(sum)* | *(sum)* | **Σ estimated** | |

## 4. Azure Cost Management — actual billed (dev resource only)

**Resource:**  
`/subscriptions/8aa56f3b-18bc-43ca-ad45-bad9e811d33b/resourceGroups/rg-ArchLucid-dev/providers/Microsoft.CognitiveServices/accounts/oai-archlucid-dev`

**Billing latency:** Cost Management often lags **24–48 hours** (sometimes longer at month boundaries).

### Automated query (evidence capture)

Script: **`scripts/evidence/query-aoai-dev-resource-cost.ps1`** — wraps **`az rest`** against **`Microsoft.CostManagement/query`** (`ActualCost`, optional **`timePeriod`**).

**Observed during evidence authoring (UTC window `2026-03-01` → `2026-05-11`):**

- **Resource-scoped** aggregation (`filter` on **`ResourceId`** above) returned **`rows: []`** — interpreted as **no attributable meter rows in API response for this filter/window** *or* zero billed usage for that resource ID representation (confirm in Portal).
- **Resource-group rollup** (`filter` **`ResourceGroupName`** `rg-ArchLucid-dev` grouped by **`ResourceId`**) returned Container Apps, ACR, Key Vault, Storage rows — **no Cognitive Services row** for **`oai-archlucid-dev`** in the returned slice — operators should validate via **Cost analysis → filter Resource = `oai-archlucid-dev`** and **`Meter subcategory`** for Azure OpenAI tokens.

### Portal checklist

1. Azure Portal → **Cost Management + Billing** → **Cost analysis**.
2. Scope: subscription **`ArchLucid DEV`** (`8aa56f3b-18bc-43ca-ad45-bad9e811d33b`).
3. Filter **Resource** = **`oai-archlucid-dev`** (or full resource ID above).
4. Grain **Daily**; export CSV for the **same UTC window** as cohort runs.

Record:

| Field | Value |
|-------|-------|
| **Billing window (UTC)** | *(Portal export)* |
| **Total Pre-tax cost (USD)** attributed to **`oai-archlucid-dev`** | *(fill)* |

When cohort totals exist, allocate actual USD **proportionally** by scenario using \(\frac{\text{scenarioTokens}}{\sum\text{tokens}}\) only when engineering confirms single-deployment mono-price assumption — otherwise keep reconciliation **aggregate-only**.

## 5. Drift math

Let **`E`** = Σ **`estimatedUsd`** from traces for measured cohort runs.  
Let **`A`** = billed USD from Cost Management for **`oai-archlucid-dev`** over the **matching UTC window**.

\[
\text{drift\%} = \begin{cases}
100 \times \frac{|E - A|}{A} & A > 0 \\
\text{undefined} & A = 0
\end{cases}
\]

| Metric | Value (evidence pass) |
|--------|------------------------|
| **Σ estimatedUsd** | *(pending operator cohort export)* |
| **Billed USD (`oai-archlucid-dev`)** | **Not observed via API in sampled window** — retry Portal export |
| **Drift %** | **TBD** |

## 6. List-price proxy (GPT-4o PAYG) — structural drift vs defaults

When **`A`** is unavailable (latency or attribution gaps), compare defaults against **public Azure OpenAI list pricing** for **`gpt-4o`** Global standard pay-as-you-go. Source as of evidence authoring: [Azure OpenAI Service pricing](https://azure.microsoft.com/en-us/pricing/details/cognitive-services/openai-service/), **GPT-4o** table — e.g. **`GPT-4o-2024-1120 Global`**: **USD 2.50 / 1M input tokens**, **USD 10.00 / 1M output tokens** (batch/discounted columns differ; use the **standard Global** row that matches your deployment). **Re-verify before budgeting** — Microsoft updates pricing pages without repo notice.

**Ratio vs shipped defaults (`0.5` / `1.5`):**

| Token class | Default / List proxy | Implied bias |
|-------------|----------------------|--------------|
| Input | \(0.5 / 2.5 \approx 0.20\) | Defaults estimate **~20%** of list-class prompt token spend |
| Output | \(1.5 / 10 = 0.15\) | Defaults estimate **~15%** of list-class completion token spend |

**Conclusion:** For **`gpt-4o`** PAYG deployments, **defaults under-estimate token-meter spend versus list pricing by a large margin (often >> 20%)**. This is **configuration drift**, not a rounding bug in **`LlmCostEstimator`**.

## 7. Proposed rate adjustments (configuration only — **material drift > 20%**)

Do **not** merge blindly — substitute negotiated EA/dev-test discounts and exact **`gpt-4o`** meter names from invoice exports.

**Baseline PAYG alignment (starting point):**

```json
"AgentExecution": {
  "LlmCostEstimation": {
    "Enabled": true,
    "InputUsdPerMillionTokens": 2.5,
    "OutputUsdPerMillionTokens": 10.0,
    "Deployments": {}
  }
}
```

Refine with **`Deployments`** keyed by **`AzureOpenAI:DeploymentName`** when multiple SKUs coexist (**`LlmDeploymentUsdRates`**).

For **`gpt-4o-mini`** or discounted commitments, **lower** rates per **`docs/library/CAPACITY_AND_COST_PLAYBOOK.md`** guidance.

## 8. Next steps

1. Complete **≥ 5** real cohort runs; paste **`scenarioId` / `runId` / tokens / estimatedUsd** into the scenario table in **Section 3** (commit append-only JSON under **`docs/evidence/`** if preferred).
2. Export Portal Cost Analysis CSV for **`oai-archlucid-dev`**, aligned UTC window; fill **Section 4** totals.
3. Recompute drift **Section 5** when **`A > 0`**.
4. If negotiated rates diverge from list proxy, update **`appsettings`** / environment overrides rather than hardcoding product defaults globally.

---

**Evidence tooling:** `scripts/evidence/query-aoai-dev-resource-cost.ps1`  
**Product refs:** `ArchLucid.AgentRuntime/LlmCostEstimator.cs`, `ArchLucid.Core/Configuration/LlmCostEstimationOptions.cs`, `ArchLucid.Application/Agents/AgentExecutionTraceRunLlmCostAggregator.cs`
