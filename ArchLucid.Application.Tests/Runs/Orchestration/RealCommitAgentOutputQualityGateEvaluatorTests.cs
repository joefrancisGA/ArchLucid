using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Configuration;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Runs.Orchestration;

[Trait("Category", "Unit")]
public sealed class RealCommitAgentOutputQualityGateEvaluatorTests
{
    [Fact]
    public void GetBlockingReasons_when_real_pilot_strict_and_trace_rejected_returns_reason()
    {
        ArchitectureRun run = new() { StructuralExecutionMode = StructuralExecutionMode.Real };
        AgentOutputQualityGateOptions options = new()
        {
            Enabled = true,
            Mode = AgentOutputQualityGateMode.PilotStrict,
        };
        AgentExecutionTrace trace = new()
        {
            TraceId = "trace-1",
            AgentType = AgentType.Topology,
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Rejected,
        };

        IReadOnlyList<string> reasons =
            RealCommitAgentOutputQualityGateEvaluator.GetBlockingReasons(run, options, [trace]);

        reasons.Should().ContainSingle();
        reasons[0].Should().Contain("trace-1");
    }

    [Fact]
    public void GetBlockingReasons_when_simulator_mode_returns_empty()
    {
        ArchitectureRun run = new() { StructuralExecutionMode = StructuralExecutionMode.Simulator };
        AgentOutputQualityGateOptions options = new()
        {
            Enabled = true,
            Mode = AgentOutputQualityGateMode.PilotStrict,
        };
        AgentExecutionTrace trace = new()
        {
            TraceId = "trace-1",
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Rejected,
        };

        RealCommitAgentOutputQualityGateEvaluator.GetBlockingReasons(run, options, [trace])
            .Should().BeEmpty();
    }
}
