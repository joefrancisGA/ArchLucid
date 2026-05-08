using ArchLucid.Contracts.Common;
using ArchLucid.Core.Configuration;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime;

/// <inheritdoc />
public sealed class AgentModelTierResolver(IConfiguration configuration, IOptionsMonitor<AgentModelTierOptions> tierOptions)
    : IAgentModelTierResolver
{
    private readonly IConfiguration _configuration =
        configuration ?? throw new ArgumentNullException(nameof(configuration));

    private readonly IOptionsMonitor<AgentModelTierOptions> _tierOptions =
        tierOptions ?? throw new ArgumentNullException(nameof(tierOptions));

    /// <inheritdoc />
    public LlmModelTier ResolveTierForAgent(AgentType agentType, LlmModelTier? taskTierOverride)
    {
        if (taskTierOverride is { } o)
            return o;

        AgentModelTierOptions opts = _tierOptions.CurrentValue;

        if (opts.AgentTypeTiers.TryGetValue(agentType.ToString(), out string? mapped)
            && TryParseTier(mapped, out LlmModelTier fromAgent))
            return fromAgent;


        return ResolveDefaultTenantTier();
    }

    /// <inheritdoc />
    public LlmModelTier ResolveDefaultTenantTier()
    {
        AgentModelTierOptions opts = _tierOptions.CurrentValue;

        if (TryParseTier(opts.DefaultTier, out LlmModelTier t))
            return t;

        return LlmModelTier.Standard;
    }

    /// <inheritdoc />
    public string ResolveDeploymentName(LlmModelTier tier)
    {
        AgentModelTierOptions opts = _tierOptions.CurrentValue;

        string? configured = tier switch
        {
            LlmModelTier.Standard => opts.StandardDeploymentName,
            LlmModelTier.Premium => opts.PremiumDeploymentName,
            LlmModelTier.Economy => opts.EconomyDeploymentName,
            _ => null
        };

        if (!string.IsNullOrWhiteSpace(configured))
            return configured.Trim();

        string? baseDeploy = _configuration["AzureOpenAI:DeploymentName"]?.Trim();

        if (string.IsNullOrWhiteSpace(baseDeploy))
            throw new InvalidOperationException("AzureOpenAI:DeploymentName is missing.");

        return baseDeploy;
    }

    private static bool TryParseTier(string? value, out LlmModelTier tier)
    {
        tier = LlmModelTier.Standard;

        if (string.IsNullOrWhiteSpace(value))
            return false;

        return Enum.TryParse(value.Trim(), ignoreCase: true, out tier);
    }
}
