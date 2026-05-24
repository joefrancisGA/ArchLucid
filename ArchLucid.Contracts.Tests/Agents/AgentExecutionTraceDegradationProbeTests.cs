using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Agents;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AgentExecutionTraceDegradationProbeTests
{
    [Theory]
    [InlineData(null, false)]
    [InlineData("", false)]
    [InlineData("   ", false)]
    [InlineData("primary", false)]
    [InlineData("fallback:East", true)]
    [InlineData("fallback:west", true)]
    public void LlmResourceFallbackModelDeployment_follows_prefix_rule(string? deployment, bool expected)
    {
        AgentExecutionTraceDegradationProbe.LlmResourceFallbackModelDeployment(deployment).Should().Be(expected);
    }

    [Fact]
    public void DistinctOrderedAgentTypeNames_keeps_distinct_and_sorts()
    {
        IReadOnlyList<AgentExecutionTrace> traces =
        [
            new AgentExecutionTrace
            {
                AgentType = AgentType.Cost,
                ModelDeploymentName =
                    AgentExecutionTraceModelMetadata.LlmCompletionFallbackDeploymentPrefix + "a",
            },
            new AgentExecutionTrace
            {
                AgentType = AgentType.Topology,
                ModelDeploymentName =
                    AgentExecutionTraceModelMetadata.LlmCompletionFallbackDeploymentPrefix + "b",
            },
            new AgentExecutionTrace
            {
                AgentType = AgentType.Topology,
                ModelDeploymentName =
                    AgentExecutionTraceModelMetadata.LlmCompletionFallbackDeploymentPrefix + "c",
            },
            new AgentExecutionTrace
            {
                AgentType = AgentType.Compliance,
                ModelDeploymentName = "primary-only",
            },
        ];

        IReadOnlyList<string> names = AgentExecutionTraceDegradationProbe.DistinctOrderedAgentTypeNames(traces);

        names.Should().Equal("Cost", "Topology");
    }
}
