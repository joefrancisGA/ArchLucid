using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.QualityGates;

using FluentAssertions;

namespace ArchLucid.Core.Tests.QualityGates;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class QualityGateRecordedEvaluationSnapshotFactoryTests
{
    [Fact]
    public void Create_maps_structural_reject_to_schema_violation_triage()
    {
        QualityGateRecordedEvaluationSnapshot snapshot = QualityGateRecordedEvaluationSnapshotFactory.Create(
            AgentOutputQualityGateOutcome.Rejected,
            0.2,
            0.8,
            AgentOutputQualityGateTelemetry.RejectReasonStructural);

        snapshot.StructuralCompletenessRatio.Should().Be(0.2);
        snapshot.SemanticScore.Should().Be(0.8);
        snapshot.RejectReasonCategory.Should().Be(AgentOutputQualityGateTelemetry.RejectReasonStructural);
        snapshot.TriageScenarioId.Should().Be(RealAgentFailureTriageScenarioIds.SchemaViolation);
    }

    [Fact]
    public void Create_maps_semantic_reject_to_grounding_insufficiency_triage()
    {
        QualityGateRecordedEvaluationSnapshot snapshot = QualityGateRecordedEvaluationSnapshotFactory.Create(
            AgentOutputQualityGateOutcome.Warned,
            0.9,
            0.2,
            AgentOutputQualityGateTelemetry.RejectReasonSemantic);

        snapshot.TriageScenarioId.Should().Be(RealAgentFailureTriageScenarioIds.GroundingInsufficiency);
    }

    [Fact]
    public void Create_accepted_outcome_has_no_triage_scenario()
    {
        QualityGateRecordedEvaluationSnapshot snapshot = QualityGateRecordedEvaluationSnapshotFactory.Create(
            AgentOutputQualityGateOutcome.Accepted,
            1.0,
            1.0,
            AgentOutputQualityGateTelemetry.RejectReasonNone);

        snapshot.TriageScenarioId.Should().BeNull();
    }
}
