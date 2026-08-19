using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Core.Configuration;

/// <summary>Optional USD-per-million-token overrides for a named Azure OpenAI deployment (prompt/completion/reasoning).</summary>
[ExcludeFromCodeCoverage(Justification = "Configuration binding DTO with no logic.")]
public sealed class LlmDeploymentUsdRates
{
    /// <summary>USD per 1M prompt tokens for this deployment; zero falls back to global <see cref="LlmCostEstimationOptions.InputUsdPerMillionTokens" />.</summary>
    public decimal InputUsdPerMillionTokens
    {
        get;
        set;
    }

    /// <summary>USD per 1M completion tokens; zero falls back to global output rate.</summary>
    public decimal OutputUsdPerMillionTokens
    {
        get;
        set;
    }

    /// <summary>
    ///     USD per 1M reasoning-class tokens when reported separately (o-series); zero uses global
    ///     <see cref="LlmCostEstimationOptions.ReasoningUsdPerMillionTokens" /> then output rate.
    /// </summary>
    public decimal ReasoningUsdPerMillionTokens
    {
        get;
        set;
    }
}
