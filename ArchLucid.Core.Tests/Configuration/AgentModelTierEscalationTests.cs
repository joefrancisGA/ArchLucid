using ArchLucid.Contracts.Common;
using ArchLucid.Core.Configuration;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Configuration;

[Trait("Category", "Unit")]
public sealed class AgentModelTierEscalationTests
{
    [Theory]
    [InlineData(LlmModelTier.Economy, LlmModelTier.Standard)]
    [InlineData(LlmModelTier.Standard, LlmModelTier.Premium)]
    [InlineData(LlmModelTier.Premium, LlmModelTier.Premium)]
    public void Escalate_moves_one_step_up_the_ladder(LlmModelTier currentTier, LlmModelTier expectedTier)
    {
        AgentModelTierEscalation.Escalate(currentTier).Should().Be(expectedTier);
    }

    [Theory]
    [InlineData(LlmModelTier.Economy, true)]
    [InlineData(LlmModelTier.Standard, true)]
    [InlineData(LlmModelTier.Premium, false)]
    public void CanEscalate_is_false_only_at_premium(LlmModelTier currentTier, bool expected)
    {
        AgentModelTierEscalation.CanEscalate(currentTier).Should().Be(expected);
    }

    [Fact]
    public void DefaultTierForAgent_maps_agents_to_luna_terra_sol_tiers()
    {
        AgentModelTierRetryDefaults.DefaultTierForAgent(AgentType.Topology).Should().Be(LlmModelTier.Economy);
        AgentModelTierRetryDefaults.DefaultTierForAgent(AgentType.Cost).Should().Be(LlmModelTier.Economy);
        AgentModelTierRetryDefaults.DefaultTierForAgent(AgentType.Compliance).Should().Be(LlmModelTier.Standard);
        AgentModelTierRetryDefaults.DefaultTierForAgent(AgentType.Critic).Should().Be(LlmModelTier.Premium);
    }
}
