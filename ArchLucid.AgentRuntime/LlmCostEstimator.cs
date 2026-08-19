using ArchLucid.Core.Agents;
using ArchLucid.Core.Configuration;

using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime;

/// <inheritdoc cref="ILlmCostEstimator" />
/// <remarks>
///     Resolves USD rates through <see cref="ILlmCostEstimationUsdRateOverride" /> on every call. FinOps replay of historical
///     traces after admin rate tuning will change aggregates — see TB-023 on <see cref="ILlmCostEstimator" />.
/// </remarks>
public sealed class LlmCostEstimator(
    IOptions<LlmCostEstimationOptions> options,
    ILlmCostEstimationUsdRateOverride usdRateOverride,
    IAgentModelAliasRegistry? modelAliasRegistry = null) : ILlmCostEstimator
{
    private readonly IOptions<LlmCostEstimationOptions> _options =
        options ?? throw new ArgumentNullException(nameof(options));

    private readonly ILlmCostEstimationUsdRateOverride _usdRateOverride =
        usdRateOverride ?? throw new ArgumentNullException(nameof(usdRateOverride));

    private readonly IAgentModelAliasRegistry? _modelAliasRegistry = modelAliasRegistry;

    /// <inheritdoc />
    public decimal? EstimateUsd(
        int inputTokens,
        int outputTokens,
        int reasoningTokens = 0,
        string? deploymentLabel = null,
        string? modelAliasId = null)
    {
        LlmCostEstimationOptions o = _options.Value;

        if (!o.Enabled || inputTokens < 0 || outputTokens < 0 || reasoningTokens < 0)
            return null;

        if (inputTokens == 0 && outputTokens == 0 && reasoningTokens == 0)
            return null;

        AgentModelAliasRegistryEntry? catalogEntry = TryResolveCatalogEntry(modelAliasId, deploymentLabel);

        if (!LlmCostEstimationEffectiveRates.TryResolve(
                o,
                _usdRateOverride,
                deploymentLabel ?? catalogEntry?.DeploymentName,
                out decimal inputRate,
                out decimal outputRate,
                out decimal reasoningRate,
                catalogEntry))
        {
            return null;
        }

        decimal inPart = inputTokens * inputRate / 1_000_000m;
        decimal outPart = outputTokens * outputRate / 1_000_000m;
        decimal reasoningPart = reasoningTokens * reasoningRate / 1_000_000m;

        return inPart + outPart + reasoningPart;
    }

    private AgentModelAliasRegistryEntry? TryResolveCatalogEntry(string? modelAliasId, string? deploymentLabel)
    {
        if (_modelAliasRegistry is null)
        {
            return null;
        }

        if (!string.IsNullOrWhiteSpace(modelAliasId)
            && _modelAliasRegistry.TryGet(modelAliasId, out AgentModelAliasRegistryEntry? byAlias)
            && byAlias is not null)
        {
            return byAlias;
        }

        if (string.IsNullOrWhiteSpace(deploymentLabel))
        {
            return null;
        }

        foreach (AgentModelAliasRegistryEntry entry in _modelAliasRegistry.ListEntries())
        {
            if (string.Equals(entry.DeploymentName, deploymentLabel.Trim(), StringComparison.OrdinalIgnoreCase))
            {
                return entry;
            }
        }

        return null;
    }
}
