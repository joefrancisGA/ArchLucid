using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Api.Models;

/// <summary>Token totals for a run (summed across agent execution traces).</summary>
[ExcludeFromCodeCoverage(Justification = "API request/response DTO; no business logic.")]
public sealed class RunLlmTokenCountsResponse
{
    public long Prompt
    {
        get;
        set;
    }

    public long Completion
    {
        get;
        set;
    }
}

/// <summary>
///     Estimated LLM spend for a run from persisted traces and <see cref="ArchLucid.Core.Configuration.ILlmCostEstimator" />.
/// </summary>
[ExcludeFromCodeCoverage(Justification = "API request/response DTO; no business logic.")]
public sealed class RunAgentLlmCostEstimateResponse
{
    /// <summary>Null when estimation is disabled, tokens are zero, or no trace contributed a computable slice.</summary>
    public decimal? EstimatedCostUsd
    {
        get;
        set;
    }

    public RunLlmTokenCountsResponse TokenCounts
    {
        get;
        set;
    } = new();

    /// <summary>
    ///     Distinct deployment labels from traces (sorted); may include simulator sentinels when token totals are zero.
    /// </summary>
    public string Model
    {
        get;
        set;
    } = string.Empty;

    /// <summary>How <see cref="EstimatedCostUsd" /> was derived. Not invoice truth.</summary>
    public string CostEstimationBasis
    {
        get;
        set;
    } = ArchLucid.Contracts.Runs.RunLlmCostEstimationBasis.Unavailable;
}
