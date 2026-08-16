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

        ArchitectureRecommendationTradeOffBuilder.ApplyTradeOffs(recommendations, findings, declaredPriorities);

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
        EffortEstimate effort = ArchitectureRecommendationEffortEstimate.Build(finding);
        RiskReductionEstimate riskReduction = ArchitectureRecommendationEffortEstimate.BuildRiskReduction(finding);

        IReadOnlyList<RecommendationAlternative> alternativeOptions =
            ArchitectureRecommendationAlternatives.Build(finding);

        return new ArchitectureRecommendation
        {
            RecommendationId = Guid.NewGuid().ToString("N"),
            Problem = finding.Title,
            Evidence = finding.Rationale,
            AffectedRequirementOrQualityAttribute = finding.Dimension.ToString(),
            ConsequenceOfInaction = ArchitectureRecommendationProposedChange.BuildConsequence(finding),
            ProposedChange = ArchitectureRecommendationProposedChange.Build(finding),
            Alternatives = alternativeOptions.Select(option => option.Path).ToList(),
            AlternativeOptions = alternativeOptions.ToList(),
            Effort = effort,
            RiskReduction = riskReduction,
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
}
