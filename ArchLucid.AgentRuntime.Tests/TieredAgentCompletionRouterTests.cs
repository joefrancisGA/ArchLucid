using ArchLucid.AgentRuntime.AgentModelAliases;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Agents;

using FluentAssertions;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Suite", "Core")]
public sealed class TieredAgentCompletionRouterTests
{
    [Fact]
    public void ResolveForAgent_returns_distinct_clients_per_tier()
    {
        StubAgentCompletionClient standardClient = new("{\"ok\":true}");
        StubAgentCompletionClient premiumClient = new("{\"ok\":true}");
        StubAgentCompletionClient economyClient = new("{\"ok\":true}");

        FixedAgentModelTierResolver resolver = new();
        TieredAgentCompletionRouter router = new(
            resolver,
            tier => tier switch
            {
                LlmModelTier.Premium => premiumClient,
                LlmModelTier.Economy => economyClient,
                _ => standardClient
            });

        (IAgentCompletionClient topologyClient, LlmModelTier topologyTier) =
            router.ResolveForAgent(AgentType.Topology, null);
        (IAgentCompletionClient askClient, _) = (router.DefaultCompletionClient, LlmModelTier.Economy);

        topologyTier.Should().Be(LlmModelTier.Premium);
        topologyClient.Should().BeSameAs(premiumClient);
        askClient.Should().BeSameAs(economyClient);
    }

    [Fact]
    public void ResolveForAgent_binds_model_alias_ambient_for_trace_recorder()
    {
        StubAgentCompletionClient premiumClient = new("{\"ok\":true}");
        FixedAgentModelTierResolver resolver = new();
        AgentModelAliasResolver aliasResolver = CreateAliasResolver(resolver);

        TieredAgentCompletionRouter router = new(
            resolver,
            _ => premiumClient,
            aliasResolver: aliasResolver);

        router.ResolveForAgent(AgentType.Topology, null);

        AgentModelAliasInvocationAmbient.TryConsume().Should().Be(AgentModelAliasIds.PremiumAssurance);
    }

    private static AgentModelAliasResolver CreateAliasResolver(IAgentModelTierResolver tierResolver)
    {
        CatalogBackedAgentModelAliasRegistry registry =
            AgentModelAliasRegistryTestsHelper.CreateCatalogRegistry(tierResolver);

        return new AgentModelAliasResolver(registry);
    }

    internal sealed class FixedAgentModelTierResolver : IAgentModelTierResolver
    {
        public LlmModelTier ResolveTierForAgent(AgentType agentType, LlmModelTier? taskTierOverride) =>
            ResolveTierForAgentTypeName(agentType.ToString(), taskTierOverride);

        public LlmModelTier ResolveTierForAgentTypeName(string agentTypeName, LlmModelTier? taskTierOverride) =>
            taskTierOverride ?? agentTypeName switch
            {
                nameof(AgentType.Topology) => LlmModelTier.Premium,
                nameof(AgentType.Critic) => LlmModelTier.Premium,
                _ => LlmModelTier.Standard
            };

        public LlmModelTier ResolveDefaultTenantTier() => LlmModelTier.Standard;

        public LlmModelTier ResolveNonAgentDefaultTier() => LlmModelTier.Economy;

        public string ResolveDeploymentName(LlmModelTier tier) => tier.ToString();
    }
}
