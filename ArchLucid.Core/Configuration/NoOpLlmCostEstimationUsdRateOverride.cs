namespace ArchLucid.Core.Configuration;

/// <summary>In-memory and test hosts: never apply a persisted USD rate override.</summary>
public sealed class NoOpLlmCostEstimationUsdRateOverride : ILlmCostEstimationUsdRateOverride
{
    public static readonly NoOpLlmCostEstimationUsdRateOverride Instance = new();

    /// <inheritdoc />
    public bool TryGetUsdPerMillionRates(out decimal inputUsdPerMillionTokens, out decimal outputUsdPerMillionTokens)
    {
        inputUsdPerMillionTokens = 0;
        outputUsdPerMillionTokens = 0;

        return false;
    }
}
