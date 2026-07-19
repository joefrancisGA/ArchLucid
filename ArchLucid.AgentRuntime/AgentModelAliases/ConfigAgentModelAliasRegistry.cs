using ArchLucid.Contracts.Common;
using ArchLucid.Core.Agents;
using ArchLucid.Core.Findings;

using IAgentModelTierResolver = ArchLucid.AgentRuntime.IAgentModelTierResolver;

namespace ArchLucid.AgentRuntime.AgentModelAliases;

/// <summary>Config-backed alias registry seeded from <see cref="IAgentModelTierResolver" /> deployments (TB-869).</summary>
public sealed class ConfigAgentModelAliasRegistry : IAgentModelAliasRegistry
{
    private readonly IReadOnlyDictionary<string, AgentModelAliasRegistryEntry> _entriesByAlias;

    public ConfigAgentModelAliasRegistry(IAgentModelTierResolver tierResolver)
    {
        ArgumentNullException.ThrowIfNull(tierResolver);

        AgentModelAliasRegistryEntry economy = BuildEntry(
            AgentModelAliasIds.EconomyGeneral,
            tierResolver.ResolveDeploymentName(LlmModelTier.Economy),
            [
                AgentModelAliasCapabilities.StructuredOutput,
                AgentModelAliasCapabilities.ToolUse
            ],
            [
                AgentModelTaskTypes.FromAgentType(AgentType.Topology),
                AgentModelTaskTypes.FromAgentType(AgentType.Cost),
                AgentModelTaskTypes.Ask,
                AgentModelTaskTypes.Explanation,
                AgentModelTaskTypes.Primary,
                AgentModelTaskTypes.SchemaRemediation
            ]);

        AgentModelAliasRegistryEntry standard = BuildEntry(
            AgentModelAliasIds.StandardGeneral,
            tierResolver.ResolveDeploymentName(LlmModelTier.Standard),
            [
                AgentModelAliasCapabilities.StructuredOutput,
                AgentModelAliasCapabilities.ToolUse,
                AgentModelAliasCapabilities.LongContext
            ],
            [
                AgentModelTaskTypes.FromAgentType(AgentType.Topology),
                AgentModelTaskTypes.FromAgentType(AgentType.Cost),
                AgentModelTaskTypes.FromAgentType(AgentType.Compliance),
                AgentModelTaskTypes.FromAgentType(AgentType.Critic),
                AgentModelTaskTypes.Ask,
                AgentModelTaskTypes.Explanation,
                AgentModelTaskTypes.Primary,
                InsightDensityJudgeAgentTypeNames.Judge
            ]);

        AgentModelAliasRegistryEntry premium = BuildEntry(
            AgentModelAliasIds.PremiumAssurance,
            tierResolver.ResolveDeploymentName(LlmModelTier.Premium),
            [
                AgentModelAliasCapabilities.StructuredOutput,
                AgentModelAliasCapabilities.ToolUse,
                AgentModelAliasCapabilities.LongContext,
                AgentModelAliasCapabilities.AdvancedReasoning
            ],
            [
                AgentModelTaskTypes.FromAgentType(AgentType.Topology),
                AgentModelTaskTypes.FromAgentType(AgentType.Cost),
                AgentModelTaskTypes.FromAgentType(AgentType.Compliance),
                AgentModelTaskTypes.FromAgentType(AgentType.Critic),
                AgentModelTaskTypes.Ask,
                AgentModelTaskTypes.Explanation,
                AgentModelTaskTypes.SemanticJudge,
                AgentModelTaskTypes.Primary,
                InsightDensityJudgeAgentTypeNames.Judge
            ]);

        _entriesByAlias = new Dictionary<string, AgentModelAliasRegistryEntry>(StringComparer.OrdinalIgnoreCase)
        {
            [economy.AliasId] = economy,
            [standard.AliasId] = standard,
            [premium.AliasId] = premium
        };
    }

    public IReadOnlyCollection<AgentModelAliasRegistryEntry> ListEntries()
    {
        return _entriesByAlias.Values.ToList();
    }

    public AgentModelAliasRegistryEntry GetRequired(string aliasId)
    {
        if (TryGet(aliasId, out AgentModelAliasRegistryEntry? entry) && entry is not null)
        {
            return entry;
        }

        throw new KeyNotFoundException($"Model alias '{aliasId}' is not registered.");
    }

    public bool TryGet(string aliasId, out AgentModelAliasRegistryEntry? entry)
    {
        if (string.IsNullOrWhiteSpace(aliasId))
        {
            entry = null;

            return false;
        }

        return _entriesByAlias.TryGetValue(aliasId.Trim(), out entry);
    }

    public string ResolveAliasIdForTier(LlmModelTier tier)
    {
        return tier switch
        {
            LlmModelTier.Economy => AgentModelAliasIds.EconomyGeneral,
            LlmModelTier.Premium => AgentModelAliasIds.PremiumAssurance,
            _ => AgentModelAliasIds.StandardGeneral
        };
    }

    private static AgentModelAliasRegistryEntry BuildEntry(
        string aliasId,
        string deploymentName,
        IReadOnlyList<string> capabilityTags,
        IReadOnlyList<string> approvedTaskTypes)
    {
        return new AgentModelAliasRegistryEntry
        {
            AliasId = aliasId,
            ProviderConnectionKind = AgentModelAliasProviderKinds.ArchLucidManagedAzureOpenAi,
            DeploymentName = deploymentName,
            CapabilityTags = capabilityTags,
            ApprovedTaskTypes = approvedTaskTypes
        };
    }
}
