using ArchLucid.AgentRuntime;

using FluentAssertions;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Category", "Unit")]
public sealed class AgentRetrievalGroundingTraceCoverageTests
{
    [Fact]
    public void Coverage_registry_lists_compliance_and_cost_agents()
    {
        IReadOnlyList<string> agents = AgentRetrievalGroundingTraceCoverageRegistry.AgentNamesWritingGroundingTraces;

        agents.Should().Contain("Compliance");
        agents.Should().Contain("Topology");
        agents.Should().Contain(RetailPriceRetrievalGroundingTraceMapper.CostAgentName);
        agents.Should().HaveCount(3);
    }
}
