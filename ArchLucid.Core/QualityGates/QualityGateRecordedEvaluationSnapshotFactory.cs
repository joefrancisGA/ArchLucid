using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;

namespace ArchLucid.Core.QualityGates;

/// <summary>Builds durable evaluation snapshots for quality warn/reject persistence (TB-964).</summary>
public static class QualityGateRecordedEvaluationSnapshotFactory
{
    public static QualityGateRecordedEvaluationSnapshot Create(
        AgentOutputQualityGateOutcome outcome,
        double structuralCompletenessRatio,
        double semanticScore,
        string rejectReasonCategory)
    {
        return new QualityGateRecordedEvaluationSnapshot
        {
            StructuralCompletenessRatio = structuralCompletenessRatio,
            SemanticScore = semanticScore,
            RejectReasonCategory = rejectReasonCategory,
            TriageScenarioId = ResolveTriageScenarioId(outcome, rejectReasonCategory),
        };
    }

    private static string? ResolveTriageScenarioId(
        AgentOutputQualityGateOutcome outcome,
        string rejectReasonCategory)
    {
        if (outcome == AgentOutputQualityGateOutcome.Accepted)
            return null;

        if (string.Equals(rejectReasonCategory, AgentOutputQualityGateTelemetry.RejectReasonStructural, StringComparison.Ordinal))
            return RealAgentFailureTriageScenarioIds.SchemaViolation;

        return RealAgentFailureTriageScenarioIds.GroundingInsufficiency;
    }
}
