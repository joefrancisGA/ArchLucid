using ArchLucid.Contracts.Common;

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

    internal sealed class FixedAgentModelTierResolver : IAgentModelTierResolver
    {
        public LlmModelTier ResolveTierForAgent(AgentType agentType, LlmModelTier? taskTierOverride) =>
            taskTierOverride ?? agentType switch
            {
                AgentType.Topology => LlmModelTier.Premium,
                AgentType.Critic => LlmModelTier.Premium,
                _ => LlmModelTier.Standard
            };

        public LlmModelTier ResolveDefaultTenantTier() => LlmModelTier.Standard;

        public LlmModelTier ResolveNonAgentDefaultTier() => LlmModelTier.Economy;

        public string ResolveDeploymentName(LlmModelTier tier) => tier.ToString();
    }
}
