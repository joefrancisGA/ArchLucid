using System.Text.Json;
using ArchLucid.Contracts.Advisory.Workflow;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance.Posture;

namespace ArchLucid.Application.ArchitectureIntelligence;

public static class ArchitectureIntelligenceProductBridge
{
    private const string EngineType = "ArchitectureIntelligence";
    private const string FindingType = "ArchitectureIntelligence.SpecialistReview";
    private const string HypothesisFindingType = "ArchitectureIntelligence.AdversarialChallenge";
    private const string Category = "ArchitectureIntelligence";
    private const string SpecialistSeverityPropertyKey = "architectureIntelligence.specialistSeverity";
    private const string SeverityStoredPropertyKey = "architectureIntelligence.severityStored";
    private const string HumanReviewStatusStoredPropertyKey = "architectureIntelligence.humanReviewStatusStored";

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

    public static List<Finding> ToHypothesisLaneFindings(IReadOnlyList<AdversarialChallenge> challenges)
    {
        ArgumentNullException.ThrowIfNull(challenges);

        List<Finding> mapped = [];

        foreach (AdversarialChallenge challenge in challenges)
        {
            if (challenge.Suppressed
                || !AdversarialChallengeLaneGuard.IsHypothesisLane(challenge)
                || AdversarialChallengeLaneGuard.ShouldDropChallenge(challenge))
            {
                continue;
            }

            mapped.Add(MapHypothesisChallenge(challenge));
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
            ["architectureIntelligence.evidenceSupportTier"] = finding.EvidenceSupportTier.ToString(),
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

        if (finding.LifecycleScope != ArchitectureLifecycleScope.Unspecified)
        {
            properties["architectureIntelligence.lifecycleScope"] = finding.LifecycleScope.ToString();
        }

        if (finding.RelatedModelElementIds.Count > 0)
        {
            properties["architectureIntelligence.relatedModelElementIds"] =
                JsonSerializer.Serialize(finding.RelatedModelElementIds);
        }

        if (finding.RelatedRequirementElementIds.Count > 0)
        {
            properties["architectureIntelligence.relatedRequirementElementIds"] =
                JsonSerializer.Serialize(finding.RelatedRequirementElementIds);
        }

        if (finding.RelatedDecisionElementIds.Count > 0)
        {
            properties["architectureIntelligence.relatedDecisionElementIds"] =
                JsonSerializer.Serialize(finding.RelatedDecisionElementIds);
        }

        if (validationByFindingId is not null
            && validationByFindingId.TryGetValue(finding.FindingId, out EvidenceValidationResult? validation)
            && validation is not null)
        {
            properties["architectureIntelligence.integrityPassed"] = validation.OverallPassedIntegrity.ToString();
            properties["architectureIntelligence.evidenceSupportTier"] = validation.SupportTier.ToString();
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

        (FindingSeverity severity, bool severityStored) = MapSeverity(finding.Severity);
        properties[SpecialistSeverityPropertyKey] = finding.Severity ?? string.Empty;
        properties[SeverityStoredPropertyKey] = severityStored.ToString();

        (FindingHumanReviewStatus humanReviewStatus, bool humanReviewStored) =
            MapHumanReviewStatus(finding.GovernanceDisposition);
        properties[HumanReviewStatusStoredPropertyKey] = humanReviewStored.ToString();

        return new Finding
        {
            FindingId = finding.FindingId,
            FindingType = FindingType,
            Category = Category,
            PolicyRuleId = BuildPolicyRuleId(finding),
            QualityDimension = ArchitecturePillarRollup.ToStorageKey(
                ArchitecturePillarRollup.FromSpecialistDimension(finding.Dimension)),
            EngineType = EngineType,
            Severity = severity,
            Title = finding.Title,
            Rationale = finding.Rationale,
            ConfidenceScore = finding.Confidence,
            HumanReviewStatus = humanReviewStatus,
            Properties = properties,
        };
    }

    private static Finding MapHypothesisChallenge(AdversarialChallenge challenge)
    {
        Dictionary<string, string> properties = new()
        {
            ["architectureIntelligence.adversarialLane"] = AdversarialLane.AdversarialChallenge.ToString(),
            ["architectureIntelligence.provenancePresentation"] = ProvenancePresentationBucket.Hypothesis.ToString(),
            ["architectureIntelligence.sourceFindingId"] = challenge.SourceFindingId ?? string.Empty,
            ["architectureIntelligence.falsificationEvidenceNeeded"] = challenge.FalsificationEvidenceNeeded ?? string.Empty,
        };

        string falsification = challenge.FalsificationEvidenceNeeded?.Trim() ?? string.Empty;
        string rationale = falsification.Length > 0
            ? $"Falsify/confirm with: {falsification}"
            : "Falsification evidence was not stored.";

        properties[SeverityStoredPropertyKey] = bool.FalseString;
        properties[HumanReviewStatusStoredPropertyKey] = bool.FalseString;

        return new Finding
        {
            FindingId = challenge.ChallengeId,
            FindingType = HypothesisFindingType,
            Category = Category,
            PolicyRuleId = null,
            QualityDimension = null,
            EngineType = EngineType,
            Severity = FindingSeverity.Info,
            Title = challenge.Hypothesis ?? string.Empty,
            Rationale = rationale,
            ConfidenceScore = challenge.Confidence,
            HumanReviewStatus = FindingHumanReviewStatus.NotRequired,
            Properties = properties,
        };
    }

    private static string BuildPolicyRuleId(SpecialistReviewFinding finding)
    {
        string dimension = finding.Dimension.ToString().ToLowerInvariant();
        string checkKey = ArchitectureIntelligenceStableCheckKey.FromFinding(finding);

        return $"architecture-intelligence.{dimension}.{checkKey}";
    }

    private static (FindingHumanReviewStatus Status, bool Stored) MapHumanReviewStatus(GovernanceDisposition disposition)
    {
        return disposition switch
        {
            GovernanceDisposition.HumanDecisionRequired => (FindingHumanReviewStatus.Pending, true),
            GovernanceDisposition.ExceptionGranted => (FindingHumanReviewStatus.Overridden, true),
            GovernanceDisposition.Accepted => (FindingHumanReviewStatus.Approved, true),
            GovernanceDisposition.Deferred => (FindingHumanReviewStatus.Pending, true),
            GovernanceDisposition.RemediationPlanned => (FindingHumanReviewStatus.Pending, true),
            GovernanceDisposition.Open => (FindingHumanReviewStatus.NotRequired, true),
            _ => (FindingHumanReviewStatus.NotRequired, false),
        };
    }

    private static (FindingSeverity Severity, bool Stored) MapSeverity(string severity)
    {
        if (string.IsNullOrWhiteSpace(severity))
        {
            return (FindingSeverity.Info, false);
        }

        if (severity.Equals("Critical", StringComparison.OrdinalIgnoreCase))
        {
            return (FindingSeverity.Critical, true);
        }

        if (severity.Equals("High", StringComparison.OrdinalIgnoreCase))
        {
            return (FindingSeverity.Error, true);
        }

        if (severity.Equals("Low", StringComparison.OrdinalIgnoreCase))
        {
            return (FindingSeverity.Info, true);
        }

        if (severity.Equals("Warning", StringComparison.OrdinalIgnoreCase))
        {
            return (FindingSeverity.Warning, true);
        }

        return (FindingSeverity.Info, false);
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
        if (recommendation.RequiresHumanApproval == true)
        {
            return "High";
        }

        return recommendation.Effort.Band;
    }

    private static int MapPriorityScore(ArchitectureRecommendation recommendation)
    {
        int score = (int)Math.Round(recommendation.Confidence * 100);

        if (recommendation.RequiresHumanApproval == true)
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
