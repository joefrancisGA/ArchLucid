using ArchLucid.AgentRuntime.Evaluation;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.QualityGates;

using FluentAssertions;

namespace ArchLucid.AgentRuntime.Tests.Evaluation;

[Trait("Category", "Unit")]
public sealed class AgentRuntimeEvaluationHunt63ProbeTests
{
    [Fact]
    public void CalibratedConfidenceByTaskId_breaks_created_utc_ties_by_result_id_when_both_rows_are_calibrated()
    {
        DateTime stamp = new(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        const string taskId = "task-1";

        IReadOnlyList<AgentResult> results =
        [
            new AgentResult
            {
                ResultId = "aaa",
                TaskId = taskId,
                CreatedUtc = stamp,
                CalibratedConfidence = 0.2,
            },
            new AgentResult
            {
                ResultId = "bbb",
                TaskId = taskId,
                CreatedUtc = stamp,
                CalibratedConfidence = 0.85,
            },
        ];

        Dictionary<string, double?> map = AgentCalibratedConfidenceByTaskIdBuilder.Build(results);

        map[taskId].Should().Be(0.85, because: "latest-result selector orders by ResultId when CreatedUtc ties");
    }

    [Fact]
    public void Recorded_evaluation_snapshot_maps_warned_structural_category_to_schema_violation_triage()
    {
        QualityGateRecordedEvaluationSnapshot snapshot = QualityGateRecordedEvaluationSnapshotFactory.Create(
            AgentOutputQualityGateOutcome.Warned,
            0.2,
            0.9,
            AgentOutputQualityGateTelemetry.RejectReasonStructural);

        snapshot.TriageScenarioId.Should().Be(RealAgentFailureTriageScenarioIds.SchemaViolation);
    }

    [Fact]
    public void TraceIdsLikelyMatch_uses_prefix_match_for_shortened_snapshot_finding_keys()
    {
        string persisted = new string('a', 40);
        string findingKey = persisted[..32];

        AgentEvaluationConfidencePipeline.TraceIdsLikelyMatch(persisted, findingKey).Should().BeTrue();
    }
}
