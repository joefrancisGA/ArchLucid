using ArchLucid.Contracts.Agents;

namespace ArchLucid.Application.Agents;

/// <summary>Per-run LLM usage totals derived from <see cref="AgentExecutionTrace" /> rows.</summary>
public sealed record AgentExecutionTraceRunLlmCostSummary(
    decimal? EstimatedCostUsd,
    long PromptTokens,
    long CompletionTokens,
    long ReasoningTokens,
    string ModelLabel,
    string CostEstimationBasis)
{
    /// <summary>Completion plus reasoning tokens for run-detail parity with engine provenance output totals.</summary>
    public long CombinedOutputTokens => CompletionTokens + ReasoningTokens;
}
