namespace ArchLucid.Core.Configuration;

/// <summary>Estimates LLM call cost from token usage and <see cref="LlmCostEstimationOptions" />.</summary>
public interface ILlmCostEstimator
{
    /// <summary>Returns pre-tax estimated cost, or <see langword="null" /> when estimation is disabled or counts are non-positive.</summary>
    /// <remarks>Estimates reflect currently configured rates.</remarks>
    decimal? EstimateUsd(
        int inputTokens,
        int outputTokens,
        int reasoningTokens = 0,
        string? deploymentLabel = null);
}
