using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AgentHandlerDegradedResultFactoryTests
{
    [Fact]
    public void Create_sets_zero_confidence_and_degradation_reason_without_prompt_content()
    {
        AgentTask task = new()
        {
            TaskId = "task-1",
            RunId = "run-1",
            AgentType = AgentType.Topology,
        };

        AgentResult result = AgentHandlerDegradedResultFactory.Create(
            "run-1",
            task,
            AgentHandlerDegradationReasonCodes.HandlerTimeout,
            "Agent output degraded due to upstream LLM latency or circuit-open state; review run telemetry.");

        result.Confidence.Should().Be(0);
        result.DegradationReasonCode.Should().Be(AgentHandlerDegradationReasonCodes.HandlerTimeout);
        result.Claims.Should().ContainSingle(c => c.Contains("degraded", StringComparison.OrdinalIgnoreCase));
        result.EvidenceRefs.Should().BeEmpty();
        result.Findings.Should().BeEmpty();
    }
}
