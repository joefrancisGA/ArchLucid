using ArchLucid.Core.AgentEvaluation;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AgentEvaluation;

[Trait("Category", "Unit")]
public sealed class AgentOutputQualityGateTelemetryTests
{
    [Theory]
    [InlineData("Real", AgentOutputQualityGateTelemetry.ExecutionModeReal)]
    [InlineData("real", AgentOutputQualityGateTelemetry.ExecutionModeReal)]
    [InlineData("Simulator", AgentOutputQualityGateTelemetry.ExecutionModeSimulator)]
    [InlineData(null, AgentOutputQualityGateTelemetry.ExecutionModeSimulator)]
    [InlineData("", AgentOutputQualityGateTelemetry.ExecutionModeSimulator)]
    public void ResolveExecutionModeLabel_maps_real_and_simulator_modes(string? configuredMode, string expected)
    {
        AgentOutputQualityGateTelemetry.ResolveExecutionModeLabel(configuredMode).Should().Be(expected);
    }
}
