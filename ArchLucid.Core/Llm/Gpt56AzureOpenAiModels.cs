namespace ArchLucid.Core.Llm;

/// <summary>
///     Canonical GPT-5.6 family deployment labels, Foundry model ids, and Global Standard list prices
///     for Azure OpenAI. Prices are USD per 1M tokens (short context) from the Microsoft Foundry
///     GPT-5.6 announcement — re-verify against the pricing page before budgeting.
/// </summary>
public static class Gpt56AzureOpenAiModels
{
    public const string LunaDeploymentName = "gpt-5.6-luna";

    public const string TerraDeploymentName = "gpt-5.6-terra";

    public const string SolDeploymentName = "gpt-5.6-sol";

    /// <summary>Foundry model version shared by Luna, Terra, and Sol GA builds.</summary>
    public const string ModelVersion = "2026-07-09";

    public const decimal LunaInputUsdPerMillionTokens = 1.00m;

    public const decimal LunaOutputUsdPerMillionTokens = 6.00m;

    public const decimal TerraInputUsdPerMillionTokens = 2.50m;

    public const decimal TerraOutputUsdPerMillionTokens = 15.00m;

    public const decimal SolInputUsdPerMillionTokens = 5.00m;

    public const decimal SolOutputUsdPerMillionTokens = 30.00m;
}
