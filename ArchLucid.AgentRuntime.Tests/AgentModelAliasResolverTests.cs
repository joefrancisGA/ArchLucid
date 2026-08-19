using ArchLucid.AgentRuntime.AgentModelAliases;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Agents;
using ArchLucid.Core.Configuration;

using FluentAssertions;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Suite", "Core")]
public sealed class AgentModelAliasResolverTests
{
    [Fact]
    public void Resolve_returns_alias_for_approved_topology_on_premium_tier()
    {
        AgentModelAliasResolver resolver = CreateResolver();

        AgentModelAliasResolution resolution = resolver.Resolve(LlmModelTier.Premium, nameof(AgentType.Topology));

        resolution.AliasId.Should().Be(AgentModelAliasIds.PremiumAssurance);
        resolution.DeploymentName.Should().Be("gpt-4o");
    }

    [Fact]
    public void Resolve_allows_schema_remediation_on_economy_alias()
    {
        AgentModelAliasResolver resolver = CreateResolver();

        AgentModelAliasResolution resolution = resolver.Resolve(
            LlmModelTier.Economy,
            AgentModelTaskTypes.SchemaRemediation);

        resolution.AliasId.Should().Be(AgentModelAliasIds.EconomyGeneral);
    }

    [Fact]
    public void Resolve_fails_closed_for_unapproved_task_on_economy_alias()
    {
        AgentModelAliasResolver resolver = CreateResolver();

        Action act = () => resolver.Resolve(LlmModelTier.Economy, nameof(AgentType.Compliance));

        act.Should().Throw<AgentModelAliasNotApprovedException>()
            .Which.AliasId.Should().Be(AgentModelAliasIds.EconomyGeneral);
    }

    [Fact]
    public void Resolve_fails_closed_when_structured_output_level_is_insufficient()
    {
        AgentModelAliasResolver resolver = new(new DegradedStructuredOutputRegistryStub());

        Action act = () => resolver.Resolve(LlmModelTier.Economy, nameof(AgentType.Topology));

        act.Should().Throw<AgentModelStructuredOutputInsufficientException>();
    }

    private static AgentModelAliasResolver CreateResolver()
    {
        AgentModelTierResolver tierResolver = AgentModelTierResolverTestsHelper.CreateResolver(
            new Dictionary<string, string?>
            {
                ["AzureOpenAI:DeploymentName"] = "primary-deploy",
                ["Llm:Deployments:Fast"] = "gpt-4o-mini",
                ["Llm:Deployments:Reasoning"] = "gpt-4o",
            },
            new AgentModelTierOptions());

        CatalogBackedAgentModelAliasRegistry registry =
            AgentModelAliasRegistryTestsHelper.CreateCatalogRegistry(tierResolver);

        return new AgentModelAliasResolver(registry);
    }

    private sealed class DegradedStructuredOutputRegistryStub : IAgentModelAliasRegistry
    {
        public IReadOnlyCollection<AgentModelAliasRegistryEntry> ListEntries() =>
            [CreateEntry(AgentModelAliasIds.EconomyGeneral)];

        public AgentModelAliasRegistryEntry GetRequired(string aliasId) => CreateEntry(aliasId);

        public bool TryGet(string aliasId, out AgentModelAliasRegistryEntry? entry)
        {
            entry = CreateEntry(aliasId);
            return true;
        }

        public string ResolveAliasIdForTier(LlmModelTier tier) => AgentModelAliasIds.EconomyGeneral;

        private static AgentModelAliasRegistryEntry CreateEntry(string aliasId) =>
            new()
            {
                AliasId = aliasId,
                ProviderConnectionKind = AgentModelAliasProviderKinds.ArchLucidManagedAzureOpenAi,
                DeploymentName = "deploy",
                CapabilityTags = [],
                ApprovedTaskTypes = [AgentModelTaskTypes.FromAgentType(AgentType.Topology)],
                StructuredOutputLevel = AgentModelStructuredOutputLevel.DegradedTextParse
            };
    }
}
