using ArchLucid.AgentRuntime.Evaluation;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Configuration;

using FluentAssertions;

using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime.Tests.Evaluation;

[Trait("Category", "Unit")]
public sealed class AgentRuntimeEvaluationHunt62ProbeTests
{
    private static readonly HeuristicOnlyAgentOutputSemanticEvaluator SemanticEvaluator =
        new(new HeuristicAgentOutputSemanticEvaluator());

    private static string MinimalValidTopologyAgentResultJson() =>
        """
        {"resultId":"a","taskId":"b","runId":"c","agentType":1,"claims":[{"text":"x","evidence":"y"}],"evidenceRefs":[],"confidence":0.5,"findings":[{"severity":"High","description":"Long enough description text","recommendation":"Fix it"}],"proposedChanges":null,"createdUtc":"2026-01-01T00:00:00Z"}
        """;
    [Fact]
    public void CalibratedConfidenceByTaskId_uses_newest_non_null_calibrated_when_latest_result_row_is_uncalibrated()
    {
        DateTime older = new(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        DateTime newer = older.AddHours(1);
        const string taskId = "task-1";

        IReadOnlyList<AgentResult> results =
        [
            new AgentResult
            {
                ResultId = "old",
                TaskId = taskId,
                CreatedUtc = older,
                CalibratedConfidence = 0.2,
            },
            new AgentResult
            {
                ResultId = "new",
                TaskId = taskId,
                CreatedUtc = newer,
                CalibratedConfidence = null,
            },
        ];

        Dictionary<string, double?> map = AgentCalibratedConfidenceByTaskIdBuilder.Build(results);

        map.Should().ContainKey(taskId);
        map[taskId].Should().Be(0.2);
    }

    [Fact]
    public async Task TryEvaluateTrace_rejects_when_latest_result_is_uncalibrated_but_older_calibrated_score_is_below_floor()
    {
        AgentOutputQualityGateOptions options = new()
        {
            Enabled = true,
            Mode = AgentOutputQualityGateMode.WarnOnly,
            StructuralRejectBelow = 0,
            SemanticRejectBelow = 0.5,
            StructuralWarnBelow = 1,
            SemanticWarnBelow = 1,
        };

        DateTime older = new(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        DateTime newer = older.AddHours(1);

        IReadOnlyList<AgentResult> results =
        [
            new AgentResult
            {
                ResultId = "old",
                TaskId = "task-1",
                CreatedUtc = older,
                CalibratedConfidence = 0.2,
            },
            new AgentResult
            {
                ResultId = "new",
                TaskId = "task-1",
                CreatedUtc = newer,
                CalibratedConfidence = null,
            },
        ];

        Dictionary<string, double?> calibratedByTaskId = AgentCalibratedConfidenceByTaskIdBuilder.Build(results);

        AgentExecutionTrace trace = new()
        {
            TraceId = "t1",
            RunId = "r",
            TaskId = "task-1",
            AgentType = AgentType.Topology,
            ParseSucceeded = true,
            ParsedResultJson = MinimalValidTopologyAgentResultJson(),
        };

        AgentOutputTraceQualityEvaluator.TraceQualityEvaluationResult? result =
            await AgentOutputTraceQualityEvaluator.TryEvaluateTraceAsync(
                trace,
                options,
                new AgentOutputEvaluator(),
                SemanticEvaluator,
                new AgentOutputQualityGate(Options.Create(options)),
                CancellationToken.None,
                calibratedConfidenceByTaskId: calibratedByTaskId);

        result.Should().NotBeNull();
        result!.GateOutcome.Should().Be(AgentOutputQualityGateOutcome.Rejected);
        result.EvaluationReason.Should().Contain("quality_gate_threshold_reject");
    }
}
