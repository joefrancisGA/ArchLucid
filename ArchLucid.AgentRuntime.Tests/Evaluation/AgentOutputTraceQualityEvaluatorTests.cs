using ArchLucid.AgentRuntime.Evaluation;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Configuration;

using FluentAssertions;

using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime.Tests.Evaluation;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AgentOutputTraceQualityEvaluatorTests
{
    private static readonly HeuristicOnlyAgentOutputSemanticEvaluator SemanticShim =
        new(new HeuristicAgentOutputSemanticEvaluator());

    [Fact]
    public async Task TryEvaluateTrace_warn_only_missing_citations_warns_when_scores_accept()
    {
        AgentOutputQualityGateOptions options = new()
        {
            Enabled = true,
            Mode = AgentOutputQualityGateMode.WarnOnly,
            StructuralRejectBelow = 0,
            SemanticRejectBelow = 0
        };

        AgentExecutionTrace trace = new()
        {
            TraceId = "t1",
            RunId = "r",
            TaskId = "task",
            AgentType = AgentType.Topology,
            ParseSucceeded = true,
            ParsedResultJson =
                """
                {"resultId":"a","taskId":"b","runId":"c","agentType":1,"claims":[{"text":"x","evidence":"y"}],"evidenceRefs":[],"confidence":0.5,"findings":[{"severity":"High","description":"Long enough description text","recommendation":"Fix it"}],"proposedChanges":null,"createdUtc":"2026-01-01T00:00:00Z"}
                """
        };

        AgentOutputTraceQualityEvaluator.TraceQualityEvaluationResult? r =
            await AgentOutputTraceQualityEvaluator.TryEvaluateTraceAsync(
                trace,
                options,
                new AgentOutputEvaluator(),
                SemanticShim,
                new AgentOutputQualityGate(Options.Create(options)),
                CancellationToken.None);

        r.Should().NotBeNull();
        r.GateOutcome.Should().Be(AgentOutputQualityGateOutcome.Warned);
    }

    [Fact]
    public async Task TryEvaluateTrace_pilot_strict_missing_citations_rejects()
    {
        AgentOutputQualityGateOptions options = new()
        {
            Enabled = true,
            Mode = AgentOutputQualityGateMode.PilotStrict
        };

        AgentExecutionTrace trace = new()
        {
            TraceId = "t1",
            RunId = "r",
            TaskId = "task",
            AgentType = AgentType.Topology,
            ParseSucceeded = true,
            ParsedResultJson =
                """
                {"resultId":"a","taskId":"b","runId":"c","agentType":1,"claims":[{"text":"x","evidence":"y"}],"evidenceRefs":[],"confidence":0.5,"findings":[{"severity":"High","description":"Long enough description text","recommendation":"Fix it"}],"proposedChanges":null,"createdUtc":"2026-01-01T00:00:00Z"}
                """
        };

        AgentOutputTraceQualityEvaluator.TraceQualityEvaluationResult? r =
            await AgentOutputTraceQualityEvaluator.TryEvaluateTraceAsync(
                trace,
                options,
                new AgentOutputEvaluator(),
                SemanticShim,
                new AgentOutputQualityGate(Options.Create(options)),
                CancellationToken.None);

        r.Should().NotBeNull();
        r.GateOutcome.Should().Be(AgentOutputQualityGateOutcome.Rejected);
    }

    [Fact]
    public async Task TryEvaluateTrace_pilot_strict_rejects_when_evidence_ref_floor_not_met_even_with_citations()
    {
        AgentOutputQualityGateOptions options = new()
        {
            Enabled = true,
            Mode = AgentOutputQualityGateMode.PilotStrict,
            PilotStrictMinEvidenceRefCount = 2,
            StructuralRejectBelow = 0,
            SemanticRejectBelow = 0,
            StructuralWarnBelow = 1.0,
            SemanticWarnBelow = 1.0
        };

        AgentExecutionTrace trace = new()
        {
            TraceId = "t1",
            RunId = "r",
            TaskId = "task",
            AgentType = AgentType.Topology,
            ParseSucceeded = true,
            ParsedResultJson =
                """
                {"resultId":"a","taskId":"b","runId":"c","agentType":1,"claims":[{"text":"x","evidence":"y"}],"evidenceRefs":["only-one"],"confidence":0.5,"findings":[{"severity":"High","description":"Long enough description text","recommendation":"Fix it"}],"proposedChanges":null,"createdUtc":"2026-01-01T00:00:00Z","citations":[{"source":"stub"}]}
                """
        };

        AgentOutputTraceQualityEvaluator.TraceQualityEvaluationResult? r =
            await AgentOutputTraceQualityEvaluator.TryEvaluateTraceAsync(
                trace,
                options,
                new AgentOutputEvaluator(),
                SemanticShim,
                new AgentOutputQualityGate(Options.Create(options)),
                CancellationToken.None);

        r.Should().NotBeNull();
        r.GateOutcome.Should().Be(AgentOutputQualityGateOutcome.Rejected);
    }

    [Fact]
    public async Task TryEvaluateTrace_warn_only_unparsed_skips_entirely()
    {
        AgentOutputQualityGateOptions options = new()
        {
            Enabled = true,
            Mode = AgentOutputQualityGateMode.WarnOnly
        };

        AgentExecutionTrace trace = new()
        {
            TraceId = "t1",
            ParseSucceeded = false,
            ParsedResultJson = null,
            AgentType = AgentType.Topology,
            RunId = "r",
            TaskId = "task"
        };

        AgentOutputTraceQualityEvaluator.TraceQualityEvaluationResult? r =
            await AgentOutputTraceQualityEvaluator.TryEvaluateTraceAsync(
                trace,
                options,
                new AgentOutputEvaluator(),
                SemanticShim,
                new AgentOutputQualityGate(Options.Create(options)),
                CancellationToken.None);

        r.Should().BeNull();
    }

    [Fact]
    public async Task TryEvaluateTrace_pilot_strict_unparsed_rejects()
    {
        AgentOutputQualityGateOptions options = new()
        {
            Enabled = true,
            Mode = AgentOutputQualityGateMode.PilotStrict
        };

        AgentExecutionTrace trace = new()
        {
            TraceId = "t1",
            ParseSucceeded = false,
            ParsedResultJson = null,
            AgentType = AgentType.Topology,
            RunId = "r",
            TaskId = "task"
        };

        AgentOutputTraceQualityEvaluator.TraceQualityEvaluationResult? r =
            await AgentOutputTraceQualityEvaluator.TryEvaluateTraceAsync(
                trace,
                options,
                new AgentOutputEvaluator(),
                SemanticShim,
                new AgentOutputQualityGate(Options.Create(options)),
                CancellationToken.None);

        r.Should().NotBeNull();
        r.GateOutcome.Should().Be(AgentOutputQualityGateOutcome.Rejected);
        r.EmitQualityGateMetric.Should().BeTrue();
    }
}
