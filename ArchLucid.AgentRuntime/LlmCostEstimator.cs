using ArchLucid.Core.Configuration;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime;

/// <inheritdoc cref="ILlmCostEstimator" />
public sealed class LlmCostEstimator(
    IOptions<LlmCostEstimationOptions> options,
    ILlmCostEstimationUsdRateOverride usdRateOverride,
    Microsoft.Extensions.Configuration.IConfiguration configuration,
    Microsoft.Extensions.Hosting.IHostEnvironment environment) : ILlmCostEstimator
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
        if (configuration.GetValue<bool>("ArchLucid:Testing:SimulateLlmBudgetExhausted") && !environment.IsProduction())
        {
            throw new ArchLucid.Core.Budgeting.LlmTokenQuotaExceededException("Simulated LLM budget exhaustion.", DateTimeOffset.UtcNow.AddHours(1));
        }

        LlmCostEstimationOptions o = _options.Value;

        if (!o.Enabled || inputTokens < 0 || outputTokens < 0 || reasoningTokens < 0)
            return null;

        if (inputTokens == 0 && outputTokens == 0 && reasoningTokens == 0)
            return null;

        decimal inputRate = o.InputUsdPerMillionTokens;
        decimal outputRate = o.OutputUsdPerMillionTokens;

        if (_usdRateOverride.TryGetUsdPerMillionRates(out decimal persistedIn, out decimal persistedOut))
        {
            inputRate = persistedIn;
            outputRate = persistedOut;
        }

        decimal reasoningRate =
            o.ReasoningUsdPerMillionTokens > 0m ? o.ReasoningUsdPerMillionTokens : outputRate;

        if (!string.IsNullOrWhiteSpace(deploymentLabel)
            && o.Deployments.TryGetValue(deploymentLabel.Trim(), out LlmDeploymentUsdRates? dep))
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
