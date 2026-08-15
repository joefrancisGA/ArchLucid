using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public sealed class ArchitectureRecommendationEngine : IArchitectureRecommendationEngine
{
    public IReadOnlyList<ArchitectureRecommendation> BuildRecommendations(
        ArchitectureKnowledgeModel model,
        IReadOnlyList<SpecialistReviewFinding> findings,
        IReadOnlyList<string> declaredPriorities)
    {
        ArgumentNullException.ThrowIfNull(model);
        ArgumentNullException.ThrowIfNull(findings);
        ArgumentNullException.ThrowIfNull(declaredPriorities);

        List<ArchitectureRecommendation> recommendations = [];

        foreach (SpecialistReviewFinding finding in findings.Where(IsActionableFinding))
        {
            recommendations.Add(CreateRecommendation(finding, declaredPriorities));
        }

        AddTradeOffIfDimensionsConflict(recommendations, findings, declaredPriorities);

        return recommendations;
    }

    private static bool IsActionableFinding(SpecialistReviewFinding finding)
    {
        return finding.Conclusion is ReviewConclusion.Fail or ReviewConclusion.Indeterminate;
    }

    private static ArchitectureRecommendation CreateRecommendation(
        SpecialistReviewFinding finding,
        IReadOnlyList<string> declaredPriorities)
    {
        string effortBand = finding.Severity.Equals("Critical", StringComparison.OrdinalIgnoreCase)
            || finding.Severity.Equals("High", StringComparison.OrdinalIgnoreCase)
            ? "High"
            : "Medium";

        string riskReductionLevel = finding.Dimension == QualityDimension.Security
            ? "High"
            : "Moderate";

        return new ArchitectureRecommendation
        {
            RecommendationId = Guid.NewGuid().ToString("N"),
            Problem = finding.Title,
            Evidence = finding.Rationale,
            AffectedRequirementOrQualityAttribute = finding.Dimension.ToString(),
            ConsequenceOfInaction = ArchitectureRecommendationProposedChange.BuildConsequence(finding),
            ProposedChange = ArchitectureRecommendationProposedChange.Build(finding),
            Alternatives = ["Defer with documented exception", "Collect additional evidence before changing design"],
            Effort = new EffortEstimate
            {
                Band = effortBand,
                BasisNotes = $"Derived from {finding.Severity} severity specialist finding.",
                ImplementationEstimateAvailable = true,
            },
            RiskReduction = new RiskReductionEstimate
            {
                Level = riskReductionLevel,
                ScenarioNotes = $"Resolving this finding reduces {finding.Dimension} exposure.",
            },
            ValidationMethod = ArchitectureRecommendationProposedChange.BuildValidationMethod(finding),
            Confidence = finding.Confidence,
            RequiresHumanApproval = finding.Severity.Equals("Critical", StringComparison.OrdinalIgnoreCase),
            Provenance = new ClaimProvenance
            {
                Origin = ClaimOrigin.SystemProposed,
                SupportStatus = SupportStatus.IndirectlySupported,
                Confidence = finding.Confidence,
                Notes = "Recommendation generated from specialist finding.",
            },
            Dependencies = declaredPriorities.ToList(),
        };
    }

    private static void AddTradeOffIfDimensionsConflict(
        List<ArchitectureRecommendation> recommendations,
        IReadOnlyList<SpecialistReviewFinding> findings,
        IReadOnlyList<string> declaredPriorities)
    {
        bool hasSecurityFinding = findings.Any(finding => finding.Dimension == QualityDimension.Security
            && finding.Conclusion != ReviewConclusion.Pass);

        bool hasCostFinding = findings.Any(finding => finding.Dimension == QualityDimension.Cost
            && finding.Conclusion != ReviewConclusion.Pass);

        if (!hasSecurityFinding || !hasCostFinding || recommendations.Count == 0)
        {
            return;
        }

        ArchitectureRecommendation primaryRecommendation = recommendations[0];
        string preferredResolution = declaredPriorities.Contains("Security", StringComparer.OrdinalIgnoreCase)
            ? "Prioritize security controls over immediate cost reduction."
            : declaredPriorities.Contains("Cost", StringComparer.OrdinalIgnoreCase)
                ? "Prioritize cost optimization with compensating security controls."
                : "Balance security and cost with explicit human approval.";

        primaryRecommendation.TradeOffs.Add(new TradeOffObject
        {
            TradeOffId = Guid.NewGuid().ToString("N"),
            ProposedDecision = "Resolve security exposure while managing cost impact.",
            Benefit = "Improved security posture.",
            CostOrRisk = "Potential increase in operating cost.",
            CompetingPositions = ["Security-first", "Cost-first"],
            RecommendedResolution = preferredResolution,
            ResolutionRationale = "Declared priorities were used to resolve competing quality dimensions.",
            RequiresHumanApproval = true,
        });
    }
}
