using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Core.Configuration;

/// <summary>
///     Optional USD cost estimation for LLM calls from reported token counts (Azure-style input/output split).
/// </summary>
[ExcludeFromCodeCoverage(Justification = "Configuration binding DTO with no logic.")]
public sealed class LlmCostEstimationOptions
{
    public const string SectionPath = "AgentExecution:LlmCostEstimation";

    /// <summary>When <see langword="false" />, <see cref="ILlmCostEstimator" /> returns <see langword="null" />.</summary>
    /// <remarks>
    ///     Defaults to <see langword="true" /> so hosts without an explicit section still surface FinOps estimates;
    ///     disable via configuration when required.
    /// </remarks>
    public bool Enabled
    {
        get;
        set;
    } = true;

    /// <summary>USD per 1M prompt (input) tokens.</summary>
    public decimal InputUsdPerMillionTokens
    {
        get;
        set;
    } = 0.5m;

    /// <summary>USD per 1M completion (output) tokens.</summary>
    public decimal OutputUsdPerMillionTokens
    {
        get;
        set;
    } = 1.5m;

    /// <summary>
    ///     USD per 1M reasoning tokens when the provider reports them separately. Zero defaults to
    ///     <see cref="OutputUsdPerMillionTokens" /> for estimation.
    /// </summary>
    public decimal ReasoningUsdPerMillionTokens
    {
        get;
        set;
    }

    /// <summary>Optional per-deployment USD rates (keys match deployment names case-insensitively).</summary>
    public Dictionary<string, LlmDeploymentUsdRates> Deployments
    {
        get;
        set;
    } = new(StringComparer.OrdinalIgnoreCase);
}
