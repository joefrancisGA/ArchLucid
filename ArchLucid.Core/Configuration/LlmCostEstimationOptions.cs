using System.Diagnostics.CodeAnalysis;

using ArchLucid.Core.Llm;

namespace ArchLucid.Core.Configuration;

/// <summary>
///     Optional pre-tax USD cost estimation for LLM calls from reported token counts (Azure-style input/output split).
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

    /// <summary>
    ///     USD per 1M prompt (input) tokens. Defaults to GPT-5.6 Terra Global Standard list price
    ///     (<see cref="Gpt56AzureOpenAiModels.TerraInputUsdPerMillionTokens" />).
    /// </summary>
    public decimal InputUsdPerMillionTokens
    {
        get;
        set;
    } = Gpt56AzureOpenAiModels.TerraInputUsdPerMillionTokens;

    /// <summary>
    ///     USD per 1M completion (output) tokens. Defaults to GPT-5.6 Terra Global Standard list price
    ///     (<see cref="Gpt56AzureOpenAiModels.TerraOutputUsdPerMillionTokens" />).
    /// </summary>
    public decimal OutputUsdPerMillionTokens
    {
        get;
        set;
    } = Gpt56AzureOpenAiModels.TerraOutputUsdPerMillionTokens;

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
