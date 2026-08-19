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
        ArgumentNullException.ThrowIfNull(finding);

        return finding.Conclusion is ReviewConclusion.Fail or ReviewConclusion.Indeterminate;
    }

    private static ArchitectureRecommendation CreateRecommendation(
        SpecialistReviewFinding finding,
        IReadOnlyList<string> declaredPriorities)
    {
        ArgumentNullException.ThrowIfNull(finding);
        ArgumentNullException.ThrowIfNull(declaredPriorities);

        EffortEstimate effort = ArchitectureRecommendationEffortEstimate.Build(finding);
        RiskReductionEstimate riskReduction = ArchitectureRecommendationEffortEstimate.BuildRiskReduction(finding);

        IReadOnlyList<RecommendationAlternative> alternativeOptions =
            ArchitectureRecommendationAlternatives.Build(finding);
        string proposedChange = ArchitectureRecommendationProposedChange.Build(finding);

        return new ArchitectureRecommendation
        {
            RecommendationId = ArchitectureRecommendationStableId.FromFinding(finding, proposedChange),
            Problem = finding.Title,
            Evidence = finding.Rationale,
            AffectedRequirementOrQualityAttribute = finding.Dimension.ToString(),
            ConsequenceOfInaction = ArchitectureRecommendationProposedChange.BuildConsequence(finding),
            ProposedChange = proposedChange,
            Alternatives = alternativeOptions.Select(option => option.Path).ToList(),
            AlternativeOptions = alternativeOptions.ToList(),
            Effort = effort,
            RiskReduction = riskReduction,
            ValidationMethod = ArchitectureRecommendationProposedChange.BuildValidationMethod(finding),
            Confidence = finding.Confidence,
            RequiresHumanApproval = string.Equals(finding.Severity, "Critical", StringComparison.OrdinalIgnoreCase),
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
