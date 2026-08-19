using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Persistence.Tests.Queries;
[Trait("Category", "Unit")]

public sealed class RunExecutionDegradationTests
{
    [Fact]
    public void Apply_to_summary_sets_true_when_simulator_fallback_only()
    {
        RunSummaryDto dto = new();
        RunRecord run = new() { RealModeFellBackToSimulator = true };

        RunExecutionDegradation.Apply(dto, run, []);

        dto.RunDegradedExecution.Should().BeTrue();
        dto.DegradedExecutionAgents.Should().BeEmpty();
    }

    [Fact]
    public void Apply_to_summary_sets_true_when_llm_resource_fallback_agents_present()
    {
        RunSummaryDto dto = new();
        RunRecord run = new() { RealModeFellBackToSimulator = false };

        RunExecutionDegradation.Apply(dto, run, ["Cost", "Topology"]);

        dto.RunDegradedExecution.Should().BeTrue();
        dto.DegradedExecutionAgents.Should().Equal("Cost", "Topology");
    }

    [Fact]
    public void Apply_to_summary_normalizes_and_orders_agent_type_names()
    {
        RunSummaryDto dto = new();
        RunRecord run = new() { RealModeFellBackToSimulator = false };

        RunExecutionDegradation.Apply(dto, run, ["topology", "Cost", "topology", " ", "cost"]);

        dto.RunDegradedExecution.Should().BeTrue();
        dto.DegradedExecutionAgents.Should().Equal("Cost", "topology");
    }

    [Fact]
    public void Apply_to_detail_matches_summary_behavior()
    {
        RunDetailDto detail = new();
        RunRecord run = new() { RealModeFellBackToSimulator = true };

        RunExecutionDegradation.Apply(detail, run, ["Critic"]);

        detail.RunDegradedExecution.Should().BeTrue();
        detail.DegradedExecutionAgents.Should().Equal("Critic");
    }
}
