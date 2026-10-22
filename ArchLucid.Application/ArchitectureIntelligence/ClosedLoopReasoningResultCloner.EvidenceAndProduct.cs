using System.Text.Json;

using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.ArchitectureIntelligence;

internal static partial class ClosedLoopReasoningResultCloner
{
    private static MustNotFailViolation CloneMustNotFailViolation(MustNotFailViolation violation)
    {
        return new MustNotFailViolation
        {
            Class = violation.Class,
            Message = violation.Message,
            Blocked = violation.Blocked,
            FindingId = violation.FindingId,
            RecommendationId = violation.RecommendationId,
        };
    }

    private static EvidenceValidationResult CloneValidationResult(EvidenceValidationResult result)
    {
        return new EvidenceValidationResult
        {
            FindingId = result.FindingId,
            StageResults = result.StageResults.Select(CloneValidationStageOutcome).ToList(),
            OverallPassedIntegrity = result.OverallPassedIntegrity,
            SemanticAssessment = result.SemanticAssessment,
            CompletenessNotes = result.CompletenessNotes,
            Escalated = result.Escalated,
            SupportTier = result.SupportTier,
        };
    }

    private static EvidenceValidationStageOutcome CloneValidationStageOutcome(EvidenceValidationStageOutcome outcome)
    {
        return new EvidenceValidationStageOutcome
        {
            Stage = outcome.Stage,
            Passed = outcome.Passed,
            Detail = outcome.Detail,
            IsDeterministic = outcome.IsDeterministic,
        };
    }

    private static Finding CloneProductFinding(Finding finding)
    {
        return new Finding
        {
            FindingSchemaVersion = finding.FindingSchemaVersion,
            FindingId = finding.FindingId,
            FindingType = finding.FindingType,
            Category = finding.Category,
            QualityDimension = finding.QualityDimension,
            EngineType = finding.EngineType,
            Severity = finding.Severity,
            Title = finding.Title,
            Rationale = finding.Rationale,
            RelatedNodeIds = finding.RelatedNodeIds.ToList(),
            RecommendedActions = finding.RecommendedActions.ToList(),
            Properties = new Dictionary<string, string>(finding.Properties),
            Payload = ClonePayload(finding.Payload),
            PayloadType = finding.PayloadType,
            Trace = CloneExplainabilityTrace(finding.Trace),
            RequestInputRef = finding.RequestInputRef,
            RunIdRef = finding.RunIdRef,
            AgentExecutionTraceId = finding.AgentExecutionTraceId,
            ModelDeploymentName = finding.ModelDeploymentName,
            ModelAlias = finding.ModelAlias,
            ModelVersion = finding.ModelVersion,
            PromptTemplateId = finding.PromptTemplateId,
            PromptTemplateVersion = finding.PromptTemplateVersion,
            ConfidenceScore = finding.ConfidenceScore,
            EvaluationConfidenceScore = finding.EvaluationConfidenceScore,
            ConfidenceLevel = finding.ConfidenceLevel,
            PolicyRuleId = finding.PolicyRuleId,
            HumanReviewStatus = finding.HumanReviewStatus,
            ReviewedByUserId = finding.ReviewedByUserId,
            ReviewedAtUtc = finding.ReviewedAtUtc,
            ReviewNotes = finding.ReviewNotes,
            ProjectedImpactUsd = finding.ProjectedImpactUsd,
            IsMuted = finding.IsMuted,
            MuteReason = finding.MuteReason,
            EnforcementTier = finding.EnforcementTier,
            InsightDensityScore = finding.InsightDensityScore,
            Treatment = finding.Treatment,
            Classification = finding.Classification,
            WhyThisIsNotGeneric = finding.WhyThisIsNotGeneric,
            PrincipalArchitectValue = finding.PrincipalArchitectValue,
            DecisionConsequence = finding.DecisionConsequence,
            AssignedToUserId = finding.AssignedToUserId,
            RemediationDueUtc = finding.RemediationDueUtc,
        };
    }

    private static object? ClonePayload(object? payload)
    {
        if (payload is null)
            return null;

        if (payload is JsonElement jsonElement)
            return jsonElement.Clone();

        if (payload is Dictionary<string, string> stringDictionary)
            return new Dictionary<string, string>(stringDictionary, StringComparer.Ordinal);

        object? deserialized = JsonSerializer.Deserialize(
            JsonSerializer.Serialize(payload),
            payload.GetType());

        if (deserialized is null)
            throw new InvalidOperationException(
                $"Unable to deep-clone finding payload of type '{payload.GetType().FullName}'.");

        return deserialized;
    }

    private static ExplainabilityTrace CloneExplainabilityTrace(ExplainabilityTrace trace)
    {
        ArgumentNullException.ThrowIfNull(trace);

        return new ExplainabilityTrace
        {
            SourceAgentExecutionTraceId = trace.SourceAgentExecutionTraceId,
            GraphNodeIdsExamined = trace.GraphNodeIdsExamined.ToList(),
            RulesApplied = trace.RulesApplied.ToList(),
            DecisionsTaken = trace.DecisionsTaken.ToList(),
            AlternativePathsConsidered = trace.AlternativePathsConsidered.ToList(),
            Notes = trace.Notes.ToList(),
            Citations = trace.Citations.ToList(),
            ReasoningTrace = trace.ReasoningTrace,
            ReasoningTraceDigestSha256 = trace.ReasoningTraceDigestSha256,
        };
    }

    private static RecommendationRecord CloneProductRecommendation(RecommendationRecord recommendation)
    {
        return new RecommendationRecord
        {
            RecommendationId = recommendation.RecommendationId,
            TenantId = recommendation.TenantId,
            WorkspaceId = recommendation.WorkspaceId,
            ProjectId = recommendation.ProjectId,
            RunId = recommendation.RunId,
            ComparedToRunId = recommendation.ComparedToRunId,
            Title = recommendation.Title,
            Category = recommendation.Category,
            Rationale = recommendation.Rationale,
            SuggestedAction = recommendation.SuggestedAction,
            Urgency = recommendation.Urgency,
            ExpectedImpact = recommendation.ExpectedImpact,
            PriorityScore = recommendation.PriorityScore,
            Status = recommendation.Status,
            CreatedUtc = recommendation.CreatedUtc,
            LastUpdatedUtc = recommendation.LastUpdatedUtc,
            ReviewedByUserId = recommendation.ReviewedByUserId,
            ReviewedByUserName = recommendation.ReviewedByUserName,
            ReviewComment = recommendation.ReviewComment,
            ResolutionRationale = recommendation.ResolutionRationale,
            SupportingFindingIdsJson = recommendation.SupportingFindingIdsJson,
            SupportingDecisionIdsJson = recommendation.SupportingDecisionIdsJson,
            SupportingArtifactIdsJson = recommendation.SupportingArtifactIdsJson,
            SourceEvidenceLinksJson = recommendation.SourceEvidenceLinksJson,
        };
    }
}
