using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance.Coverage;
using ArchLucid.Retrieval.PolicyPacks;

using FluentAssertions;

namespace ArchLucid.Retrieval.Tests.PolicyPacks;

[Trait("Suite", "Core")]
public sealed class AgentPolicyPackRetrievalProfilesTests
{
    [Theory]
    [InlineData(AgentType.Topology, QualityDimension.ReliabilityAndResilience, true)]
    [InlineData(AgentType.Topology, QualityDimension.CostEffectiveness, false)]
    [InlineData(AgentType.Topology, null, false)]
    [InlineData(AgentType.Cost, QualityDimension.CostEffectiveness, true)]
    [InlineData(AgentType.Cost, QualityDimension.Security, false)]
    [InlineData(AgentType.Compliance, QualityDimension.CostEffectiveness, true)]
    [InlineData(AgentType.Compliance, null, true)]
    public void IncludesPack_respects_agent_dimension_scope(
        AgentType agentType,
        QualityDimension? packDimension,
        bool expected)
    {
        AgentPolicyPackRetrievalProfiles.IncludesPack(agentType, packDimension).Should().Be(expected);
    }

    [Fact]
    public void BuildDimensionQuerySuffix_adds_topology_framing_terms()
    {
        string suffix = AgentPolicyPackRetrievalProfiles.BuildDimensionQuerySuffix(AgentType.Topology);

        suffix.Should().Contain("reliability");
        suffix.Should().Contain("performance");
    }

    [Fact]
    public void BuildDimensionQuerySuffix_adds_cost_framing_terms()
    {
        string suffix = AgentPolicyPackRetrievalProfiles.BuildDimensionQuerySuffix(AgentType.Cost);

        suffix.Should().Contain("FinOps");
        suffix.Should().Contain("cost optimization");
    }
}
