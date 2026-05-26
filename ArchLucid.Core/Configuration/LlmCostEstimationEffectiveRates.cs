namespace ArchLucid.Core.Configuration;

/// <summary>Resolves effective USD/M token rates for <see cref="ILlmCostEstimator" />.</summary>
public static class LlmCostEstimationEffectiveRates
{
    /// <summary>Hardcoded positive defaults when configuration or overrides are non-positive (Improvement #13).</summary>
    public const decimal DefaultInputUsdPerMillionTokens = 0.5m;

    /// <summary>Hardcoded positive defaults when configuration or overrides are non-positive (Improvement #13).</summary>
    public const decimal DefaultOutputUsdPerMillionTokens = 1.5m;

    /// <summary>
    ///     Resolves input/output/reasoning USD per 1M token rates. Non-positive configured values fall back to
    ///     <see cref="DefaultInputUsdPerMillionTokens" /> / <see cref="DefaultOutputUsdPerMillionTokens" />.
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

        inputRate = PositiveOrDefault(options.InputUsdPerMillionTokens, DefaultInputUsdPerMillionTokens);
        outputRate = PositiveOrDefault(options.OutputUsdPerMillionTokens, DefaultOutputUsdPerMillionTokens);

        if (usdRateOverride.TryGetUsdPerMillionRates(out decimal persistedIn, out decimal persistedOut))
        {
            inputRate = PositiveOrDefault(persistedIn, inputRate);
            outputRate = PositiveOrDefault(persistedOut, outputRate);
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

        inputRate = PositiveOrDefault(inputRate, DefaultInputUsdPerMillionTokens);
        outputRate = PositiveOrDefault(outputRate, DefaultOutputUsdPerMillionTokens);
        reasoningRate = PositiveOrDefault(reasoningRate, DefaultOutputUsdPerMillionTokens);

        return true;
    }

    private static decimal PositiveOrDefault(decimal candidate, decimal fallback) =>
        candidate > 0m ? candidate : fallback;
}
