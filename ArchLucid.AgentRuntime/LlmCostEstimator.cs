using ArchLucid.Core.Configuration;

using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime;

/// <inheritdoc cref="ILlmCostEstimator" />
public sealed class LlmCostEstimator(IOptions<LlmCostEstimationOptions> options) : ILlmCostEstimator
{
    private readonly IOptions<LlmCostEstimationOptions> _options =
        options ?? throw new ArgumentNullException(nameof(options));

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

        decimal inputRate = o.InputUsdPerMillionTokens;
        decimal outputRate = o.OutputUsdPerMillionTokens;
        decimal reasoningRate =
            o.ReasoningUsdPerMillionTokens > 0m ? o.ReasoningUsdPerMillionTokens : outputRate;

        if (!string.IsNullOrWhiteSpace(deploymentLabel)
            && o.Deployments.TryGetValue(deploymentLabel.Trim(), out LlmDeploymentUsdRates? dep)
            && dep is not null)
        {
            if (dep.InputUsdPerMillionTokens > 0m)
                inputRate = dep.InputUsdPerMillionTokens;

            if (dep.OutputUsdPerMillionTokens > 0m)
                outputRate = dep.OutputUsdPerMillionTokens;

            if (dep.ReasoningUsdPerMillionTokens > 0m)
                reasoningRate = dep.ReasoningUsdPerMillionTokens;
        }

        decimal inPart = inputTokens * inputRate / 1_000_000m;
        decimal outPart = outputTokens * outputRate / 1_000_000m;
        decimal reasoningPart = reasoningTokens * reasoningRate / 1_000_000m;

        return inPart + outPart + reasoningPart;
    }
}
