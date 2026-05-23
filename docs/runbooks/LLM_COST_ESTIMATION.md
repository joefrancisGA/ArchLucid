> **Scope:** Operator tuning for LLM pre-call estimates vs post-call token billing.

# LLM cost estimation and telemetry

## Purpose

Monthly dollar budget guards (`LlmMonthlyTenantDollarBudgetTracker`) reserve spend using **assumed max tokens per request** before each completion. Support and platform engineers need structured logs comparing those estimates to **actual** Azure OpenAI usage so hard caps can be tuned without surprise blocks or COGS overshoot.

## Structured log event

After each successful completion, `LlmCompletionAccountingClient` emits:

| Field | Meaning |
|-------|---------|
| `EventName` | `archlucid.llm.cost_delta` |
| `RunId` | From OTel activity tag `archlucid.run_id` when present |
| `AgentType` | From OTel activity tag `archlucid.agent.type_enum` when present |
| `EstimatedPromptTokens` | `LlmMonthlyTenantDollarBudgetOptions.AssumedMaxPromptTokensPerRequest` |
| `EstimatedCompletionTokens` | `LlmMonthlyTenantDollarBudgetOptions.AssumedMaxCompletionTokensPerRequest` |
| `EstimatedUsd` | `ILlmCostEstimator.EstimateUsd(estimated prompt, estimated completion)` |
| `ActualPromptTokens` | Usage returned by the provider |
| `ActualCompletionTokens` | Usage returned by the provider |
| `ActualUsd` | `ILlmCostEstimator.EstimateUsd(actual prompt, actual completion)` |
| `DeltaUsd` | `ActualUsd - EstimatedUsd` |

**Query example (KQL / structured log search):**

```text
EventName == "archlucid.llm.cost_delta" | where DeltaUsd > 0.01
```

Prompt text is never logged. Billing enforcement and hard-cap logic are unchanged by this telemetry.

## Related configuration

| Key | Role |
|-----|------|
| `LlmMonthlyTenantDollarBudget:*` | Assumed max tokens and UTC-month hard cutoff |
| `LlmCostEstimation:*` | USD/M token rates used by `ILlmCostEstimator` |
| `ArchLucid:Testing:SimulateLlmBudgetExhausted` | QA flag — forces hard cap in non-Production hosts |

See [`CONFIGURATION_REFERENCE.md`](../library/CONFIGURATION_REFERENCE.md) and [`OPERATIONS_LLM_QUOTA.md`](../library/OPERATIONS_LLM_QUOTA.md).
