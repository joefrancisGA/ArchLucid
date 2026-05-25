using ArchLucid.Core.Configuration;

using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime;

/// <inheritdoc cref="ILlmCostEstimator" />
public sealed class LlmCostEstimator(
    IOptions<LlmCostEstimationOptions> options,
    ILlmCostEstimationUsdRateOverride usdRateOverride) : ILlmCostEstimator
{
    private readonly IOptions<LlmCostEstimationOptions> _options =
        options ?? throw new ArgumentNullException(nameof(options));

    private readonly ILlmCostEstimationUsdRateOverride _usdRateOverride =
        usdRateOverride ?? throw new ArgumentNullException(nameof(usdRateOverride));

    /// <inheritdoc />
    public decimal? EstimateUsd(
        int inputTokens,
        int outputTokens,
        int reasoningTokens = 0,
        string? deploymentLabel = null)
    {
        LlmCostEstimationOptions o = _options.Value;

        if (!o.Enabled || inputTokens < 0 || outputTokens < 0 || reasoningTokens < 0)
            return null;

        if (inputTokens == 0 && outputTokens == 0 && reasoningTokens == 0)
            return null;

        if (!LlmCostEstimationEffectiveRates.TryResolve(
                o,
                _usdRateOverride,
                deploymentLabel,
                out decimal inputRate,
                out decimal outputRate,
                out decimal reasoningRate))
        {
            return null;
        }

        decimal inPart = inputTokens * inputRate / 1_000_000m;
        decimal outPart = outputTokens * outputRate / 1_000_000m;
        decimal reasoningPart = reasoningTokens * reasoningRate / 1_000_000m;

        return inPart + outPart + reasoningPart;
    }
}
