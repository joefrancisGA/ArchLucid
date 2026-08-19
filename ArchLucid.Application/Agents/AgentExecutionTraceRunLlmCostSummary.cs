using ArchLucid.Contracts.Agents;

namespace ArchLucid.Application.Agents;

/// <summary>Per-run LLM usage totals derived from <see cref="AgentExecutionTrace" /> rows.</summary>
public sealed record AgentExecutionTraceRunLlmCostSummary(
    decimal? EstimatedCostUsd,
    long PromptTokens,
    long CompletionTokens,
    string ModelLabel,
    string CostEstimationBasis);
