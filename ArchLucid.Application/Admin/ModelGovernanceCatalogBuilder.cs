using ArchLucid.Application.Tenancy;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Agents;
using ArchLucid.Core.Configuration.Summary;

namespace ArchLucid.Application.Admin;

public sealed class ModelGovernanceCatalogBuilder(IAgentModelAliasRegistry aliasRegistry)
{
    private readonly IAgentModelAliasRegistry _aliasRegistry =
        aliasRegistry ?? throw new ArgumentNullException(nameof(aliasRegistry));

    public ModelGovernanceCatalogResponse Build(WorkspaceModelExecutionProfileSnapshot workspaceProfile)
    {
        ArgumentNullException.ThrowIfNull(workspaceProfile);

        return new ModelGovernanceCatalogResponse
        {
            WorkspaceProfile = new WorkspaceModelExecutionProfileResponse
            {
                EffectiveProfile = AgentModelExecutionProfileParser.Format(workspaceProfile.EffectiveProfile),
                Source = workspaceProfile.Source.ToString(),
                WorkspaceDefaultProfile = AgentModelExecutionProfileParser.Format(
                    WorkspaceModelExecutionProfileService.WorkspaceDefaultProfile)
            },
            RegistryEntries = _aliasRegistry
                .ListEntries()
                .Select(
                    entry => new ModelAliasRegistryEntryResponse
                    {
                        AliasId = entry.AliasId,
                        ProviderConnectionKind = entry.ProviderConnectionKind,
                        CapabilityTags = entry.CapabilityTags,
                        ApprovedTaskTypes = entry.ApprovedTaskTypes
                    })
                .OrderBy(entry => entry.AliasId, StringComparer.OrdinalIgnoreCase)
                .ToList(),
            ProfileMappings =
            [
                BuildProfileMapping(AgentModelExecutionProfile.Economy),
                BuildProfileMapping(AgentModelExecutionProfile.Balanced),
                BuildProfileMapping(AgentModelExecutionProfile.HighAssurance)
            ]
        };
    }

    private ModelGovernanceProfileMappingResponse BuildProfileMapping(AgentModelExecutionProfile profile)
    {
        AgentType[] agentTypes =
        [
            AgentType.Topology,
            AgentType.Cost,
            AgentType.Compliance,
            AgentType.Critic
        ];

        List<ModelGovernanceProfileAgentAliasMappingResponse> mappings = agentTypes
            .Select(
                agentType => new ModelGovernanceProfileAgentAliasMappingResponse
                {
                    AgentType = agentType.ToString(),
                    AliasId = _aliasRegistry.ResolveAliasIdForTier(
                        AgentModelExecutionProfileTierPolicy.ResolveTier(profile, agentType))
                })
            .ToList();

        return new ModelGovernanceProfileMappingResponse
        {
            Profile = AgentModelExecutionProfileParser.Format(profile),
            AgentAliasMappings = mappings
        };
    }
}
