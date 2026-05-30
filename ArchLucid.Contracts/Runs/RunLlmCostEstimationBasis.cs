namespace ArchLucid.Contracts.Runs;

/// <summary>
///     Labels how run-level LLM cost figures were derived. Never implies invoice or Azure Cost Management truth.
/// </summary>
public static class RunLlmCostEstimationBasis
{
    public const string EstimatedFromConfiguredRates = "estimated-from-configured-rates";

    public const string ProviderTokensWithoutRate = "provider-tokens-without-rate";

    public const string Unavailable = "unavailable";

    public const string EstimationDisabled = "estimation-disabled";
}
