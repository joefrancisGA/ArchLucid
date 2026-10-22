using ArchLucid.Contracts.Common;
using ArchLucid.Core.Agents;

namespace ArchLucid.AgentRuntime.AgentModelAliases;

/// <summary>Resolves governed model aliases for tier + task pairs (TB-869).</summary>
public interface IAgentModelAliasResolver
{
    AgentModelAliasResolution Resolve(LlmModelTier tier, string taskType);
}
