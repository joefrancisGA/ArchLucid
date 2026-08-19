namespace ArchLucid.Contracts.Runs;

/// <summary>
///     Estimated LLM spend for a run from persisted traces and host-configured cost estimation.
/// </summary>
public sealed class RunAgentLlmCostEstimateDto
{
    /// <summary>Null when estimation is disabled, tokens are zero, or no trace contributed a computable slice.</summary>
    public decimal? EstimatedCostUsd
    {
        get;
        set;
    }

    public RunLlmTokenCountsDto TokenCounts
    {
        get;
        set;
    } = new();

    /// <summary>Distinct deployment labels from traces (sorted).</summary>
    public string Model
    {
        get;
        set;
    } = string.Empty;

    /// <summary>
    ///     How <see cref="EstimatedCostUsd" /> was derived. See <see cref="RunLlmCostEstimationBasis" />.
    /// </summary>
    public string CostEstimationBasis
    {
        get;
        set;
    } = RunLlmCostEstimationBasis.Unavailable;
}
