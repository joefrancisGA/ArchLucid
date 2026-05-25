namespace ArchLucid.Core.Configuration;

/// <summary>Resolves effective USD/M token rates for <see cref="ILlmCostEstimator" />.</summary>
public static class LlmCostEstimationEffectiveRates
{
    /// <summary>
    ///     Resolves input/output/reasoning USD per 1M token rates. Returns <see langword="false" /> when any effective rate is negative.
    /// </summary>
    public static bool TryResolve(
        LlmCostEstimationOptions options,
        ILlmCostEstimationUsdRateOverride usdRateOverride,
        string? deploymentLabel,
        out decimal inputRate,
        out decimal outputRate,
        out decimal reasoningRate)
    {
        ArgumentNullException.ThrowIfNull(options);
        ArgumentNullException.ThrowIfNull(usdRateOverride);

        inputRate = options.InputUsdPerMillionTokens;
        outputRate = options.OutputUsdPerMillionTokens;

        if (usdRateOverride.TryGetUsdPerMillionRates(out decimal persistedIn, out decimal persistedOut))
        {
            inputRate = persistedIn;
            outputRate = persistedOut;
        }

        reasoningRate =
            options.ReasoningUsdPerMillionTokens > 0m ? options.ReasoningUsdPerMillionTokens : outputRate;

        if (!string.IsNullOrWhiteSpace(deploymentLabel)
            && options.Deployments.TryGetValue(deploymentLabel.Trim(), out LlmDeploymentUsdRates? dep)
            && dep is not null)
        {
            if (dep.InputUsdPerMillionTokens > 0m)
                inputRate = dep.InputUsdPerMillionTokens;

            if (dep.OutputUsdPerMillionTokens > 0m)
                outputRate = dep.OutputUsdPerMillionTokens;

            if (dep.ReasoningUsdPerMillionTokens > 0m)
                reasoningRate = dep.ReasoningUsdPerMillionTokens;
        }

        if (inputRate < 0m || outputRate < 0m || reasoningRate < 0m)
            return false;

        return true;
    }
}
