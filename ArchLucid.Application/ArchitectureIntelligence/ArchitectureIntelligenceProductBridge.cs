using System.Text.Json;
using ArchLucid.Contracts.Advisory.Workflow;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.ArchitectureIntelligence;

public static class ArchitectureIntelligenceProductBridge
{
    private const string EngineType = "ArchitectureIntelligence";
    private const string FindingType = "ArchitectureIntelligence.SpecialistReview";
    private const string Category = "ArchitectureIntelligence";

    public static List<Finding> ToFindings(IReadOnlyList<SpecialistReviewFinding> findings)
    {
        return ToFindings(findings, validationByFindingId: null);
    }

    public static List<Finding> ToFindings(
        IReadOnlyList<SpecialistReviewFinding> findings,
        IReadOnlyDictionary<string, EvidenceValidationResult>? validationByFindingId)
    {
        ArgumentNullException.ThrowIfNull(findings);

        List<Finding> mapped = [];

        foreach (SpecialistReviewFinding finding in findings)
        {
            mapped.Add(MapFinding(finding, validationByFindingId));
        }

        return mapped;
    }

    public static List<RecommendationRecord> ToRecommendationRecords(
        IReadOnlyList<ArchitectureRecommendation> recommendations,
        IReadOnlyList<SpecialistReviewFinding> sourceFindings,
        string tenantId,
        string workspaceId,
        string projectId,
        string? runId = null)
    {
        ArgumentNullException.ThrowIfNull(recommendations);
        ArgumentNullException.ThrowIfNull(sourceFindings);

        if (string.IsNullOrWhiteSpace(tenantId))
        {
            throw new ArgumentException("TenantId is required.", nameof(tenantId));
        }

        if (string.IsNullOrWhiteSpace(workspaceId))
        {
            throw new ArgumentException("WorkspaceId is required.", nameof(workspaceId));
        }

        if (string.IsNullOrWhiteSpace(projectId))
        {
            throw new ArgumentException("ProjectId is required.", nameof(projectId));
        }

        Guid tenantGuid = ArchitectureIntelligenceTenantIdMapper.ToStorageGuid(tenantId);
        Guid workspaceGuid = ArchitectureIntelligenceTenantIdMapper.ToStorageGuid(workspaceId);
        Guid projectGuid = ArchitectureIntelligenceTenantIdMapper.ToStorageGuid(projectId);
        Guid runGuid = ArchitectureIntelligenceTenantIdMapper.ToStorageGuidOrEmpty(runId);
        DateTime nowUtc = TimeProvider.System.GetUtcNow().UtcDateTime;

        List<RecommendationRecord> records = [];

        foreach (ArchitectureRecommendation recommendation in recommendations)
        {
            List<string> supportingFindingIds = ResolveSupportingFindingIds(recommendation, sourceFindings);

            records.Add(new RecommendationRecord
            {
                RecommendationId = Guid.TryParse(recommendation.RecommendationId, out Guid recommendationGuid)
                    ? recommendationGuid
                    : Guid.NewGuid(),
                TenantId = tenantGuid,
                WorkspaceId = workspaceGuid,
                ProjectId = projectGuid,
                RunId = runGuid,
                Title = recommendation.Problem,
                Category = recommendation.AffectedRequirementOrQualityAttribute,
                Rationale = recommendation.Evidence,
                SuggestedAction = recommendation.ProposedChange,
                Urgency = MapUrgency(recommendation),
                ExpectedImpact = recommendation.RiskReduction.Level,
                PriorityScore = MapPriorityScore(recommendation),
                Status = RecommendationStatus.Proposed,
                CreatedUtc = nowUtc,
                LastUpdatedUtc = nowUtc,
                SupportingFindingIdsJson = JsonSerializer.Serialize(supportingFindingIds),
            });
        }

        return records;
    }

    private static Finding MapFinding(
        SpecialistReviewFinding finding,
        IReadOnlyDictionary<string, EvidenceValidationResult>? validationByFindingId)
    {
        ProvenancePresentationBucket presentationBucket = ProvenancePresentationMapper.MapFinding(finding);

        Dictionary<string, string> properties = new()
        {
            ["architectureIntelligence.dimension"] = finding.Dimension.ToString(),
            ["architectureIntelligence.reviewConclusion"] = finding.Conclusion.ToString(),
            ["architectureIntelligence.evidenceCondition"] = finding.EvidenceCondition.ToString(),
            ["architectureIntelligence.governanceDisposition"] = finding.GovernanceDisposition.ToString(),
            ["architectureIntelligence.conclusion"] = finding.Conclusion.ToString(),
            ["architectureIntelligence.provenance"] = JsonSerializer.Serialize(finding.Provenance),
            ["architectureIntelligence.provenancePresentation"] = presentationBucket.ToString(),
        };

        if (finding.EvidenceArtifactIds.Count > 0)
        {
            properties["architectureIntelligence.evidenceArtifactIds"] =
                JsonSerializer.Serialize(finding.EvidenceArtifactIds);
        }

        if (validationByFindingId is not null
            && validationByFindingId.TryGetValue(finding.FindingId, out EvidenceValidationResult? validation)
            && validation is not null)
        {
            properties["architectureIntelligence.integrityPassed"] = validation.OverallPassedIntegrity.ToString();
            properties["architectureIntelligence.escalated"] = validation.Escalated.ToString();
            properties["architectureIntelligence.semanticAssessment"] =
                validation.SemanticAssessment?.ToString() ?? string.Empty;
            properties["architectureIntelligence.validationStages"] = JsonSerializer.Serialize(
                validation.StageResults.Select(stage => new
                {
                    stage = stage.Stage.ToString(),
                    passed = stage.Passed,
                    isDeterministic = stage.IsDeterministic,
                    detail = stage.Detail ?? string.Empty,
                }));
        }

        return new Finding
        {
            FindingId = finding.FindingId,
            FindingType = FindingType,
            Category = Category,
            EngineType = EngineType,
            Severity = MapSeverity(finding.Severity),
            Title = finding.Title,
            Rationale = finding.Rationale,
            ConfidenceScore = finding.Confidence,
            HumanReviewStatus = MapHumanReviewStatus(finding.GovernanceDisposition),
            Properties = properties,
        };
    }

    private static FindingHumanReviewStatus MapHumanReviewStatus(GovernanceDisposition disposition)
    {
        return disposition switch
        {
            GovernanceDisposition.HumanDecisionRequired => FindingHumanReviewStatus.Pending,
            GovernanceDisposition.ExceptionGranted => FindingHumanReviewStatus.Overridden,
            GovernanceDisposition.Accepted => FindingHumanReviewStatus.Approved,
            GovernanceDisposition.Deferred => FindingHumanReviewStatus.Pending,
            GovernanceDisposition.RemediationPlanned => FindingHumanReviewStatus.Pending,
            _ => FindingHumanReviewStatus.NotRequired,
        };
    }

    private static FindingSeverity MapSeverity(string severity)
    {
        if (severity.Equals("Critical", StringComparison.OrdinalIgnoreCase))
        {
            return FindingSeverity.Critical;
        }

        if (severity.Equals("High", StringComparison.OrdinalIgnoreCase))
        {
            return FindingSeverity.Error;
        }

        if (severity.Equals("Low", StringComparison.OrdinalIgnoreCase))
        {
            return FindingSeverity.Info;
        }

        return FindingSeverity.Warning;
    }

    private static List<string> ResolveSupportingFindingIds(
        ArchitectureRecommendation recommendation,
        IReadOnlyList<SpecialistReviewFinding> sourceFindings)
    {
        List<string> ids = sourceFindings
            .Where(finding => string.Equals(finding.Title, recommendation.Problem, StringComparison.OrdinalIgnoreCase)
                || recommendation.ProposedChange.Contains(finding.Title, StringComparison.OrdinalIgnoreCase))
            .Select(finding => finding.FindingId)
            .Distinct(StringComparer.Ordinal)
            .ToList();

        return ids;
    }

    private static string MapUrgency(ArchitectureRecommendation recommendation)
    {
        if (recommendation.RequiresHumanApproval)
        {
            return "High";
        }

        return recommendation.Effort.Band;
    }

    private static int MapPriorityScore(ArchitectureRecommendation recommendation)
    {
        int score = (int)Math.Round(recommendation.Confidence * 100);

        if (recommendation.RequiresHumanApproval)
        {
            score += 10;
        }

        if (score > 100)
        {
            return 100;
        }

        if (score < 0)
        {
            return 0;
        }

        return score;
    }
}
