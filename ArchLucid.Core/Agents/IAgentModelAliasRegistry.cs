using ArchLucid.Contracts.Common;

namespace ArchLucid.Core.Agents;

/// <summary>Read-only catalog of customer-facing model aliases (TB-869).</summary>
public interface IAgentModelAliasRegistry
{
    IReadOnlyCollection<AgentModelAliasRegistryEntry> ListEntries();

    AgentModelAliasRegistryEntry GetRequired(string aliasId);

    bool TryGet(string aliasId, out AgentModelAliasRegistryEntry? entry);

    string ResolveAliasIdForTier(LlmModelTier tier);
}
