using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>Multi-dimension trade-off synthesis (TB-2338 item 40).</summary>
internal static class ArchitectureRecommendationTradeOffBuilder
{
    internal static void ApplyTradeOffs(
        List<ArchitectureRecommendation> recommendations,
        IReadOnlyList<SpecialistReviewFinding> findings,
        IReadOnlyList<string> declaredPriorities)
    {
        ArgumentNullException.ThrowIfNull(recommendations);
        ArgumentNullException.ThrowIfNull(findings);
        ArgumentNullException.ThrowIfNull(declaredPriorities);

        if (recommendations.Count == 0)
        {
            return;
        }

        TryAddTradeOff(
            recommendations,
            findings,
            declaredPriorities,
            QualityDimension.Security,
            QualityDimension.Cost,
            "Security-first",
            "Cost-first",
            "Resolve security exposure while managing cost impact.",
            "Improved security posture.",
            "Potential increase in operating cost.");

        TryAddTradeOff(
            recommendations,
            findings,
            declaredPriorities,
            QualityDimension.Security,
            QualityDimension.Reliability,
            "Security-first",
            "Availability-first",
            "Resolve security controls without weakening recovery objectives.",
            "Reduced exposure from stronger access controls.",
            "Potential complexity or latency impact on recovery paths.");

        TryAddTradeOff(
            recommendations,
            findings,
            declaredPriorities,
            QualityDimension.Reliability,
            QualityDimension.Cost,
            "Recovery-first",
            "Cost-first",
            "Meet recovery objectives while managing spend.",
            "Higher availability and faster recovery.",
            "Additional replication, backup, or failover cost.");
    }

    private static void TryAddTradeOff(
        List<ArchitectureRecommendation> recommendations,
        IReadOnlyList<SpecialistReviewFinding> findings,
        IReadOnlyList<string> declaredPriorities,
        QualityDimension firstDimension,
        QualityDimension secondDimension,
        string firstPositionLabel,
        string secondPositionLabel,
        string proposedDecision,
        string benefit,
        string costOrRisk)
    {
        bool hasFirstFinding = findings.Any(
            finding => finding.Dimension == firstDimension && finding.Conclusion != ReviewConclusion.Pass);
        bool hasSecondFinding = findings.Any(
            finding => finding.Dimension == secondDimension && finding.Conclusion != ReviewConclusion.Pass);

        if (!hasFirstFinding || !hasSecondFinding)
        {
            return;
        }

        ArchitectureRecommendation target = recommendations.First(
            recommendation => recommendation.AffectedRequirementOrQualityAttribute.Equals(
                firstDimension.ToString(),
                StringComparison.Ordinal)
                || recommendation.AffectedRequirementOrQualityAttribute.Equals(
                    secondDimension.ToString(),
                    StringComparison.Ordinal));

        string preferredResolution = BuildPreferredResolution(
            declaredPriorities,
            firstDimension,
            secondDimension,
            firstPositionLabel,
            secondPositionLabel);

        target.TradeOffs.Add(new TradeOffObject
        {
            TradeOffId = Guid.NewGuid().ToString("N"),
            ProposedDecision = proposedDecision,
            Benefit = benefit,
            CostOrRisk = costOrRisk,
            CompetingPositions = [firstPositionLabel, secondPositionLabel],
            RecommendedResolution = preferredResolution,
            ResolutionRationale =
                $"Declared priorities were used to resolve competing {firstDimension} and {secondDimension} findings.",
            RequiresHumanApproval = true,
        });
    }

    private static string BuildPreferredResolution(
        IReadOnlyList<string> declaredPriorities,
        QualityDimension firstDimension,
        QualityDimension secondDimension,
        string firstPositionLabel,
        string secondPositionLabel)
    {
        string firstToken = firstDimension.ToString();
        string secondToken = secondDimension.ToString();

        bool prefersFirst = declaredPriorities.Any(
            priority => priority.Contains(firstToken, StringComparison.OrdinalIgnoreCase));
        bool prefersSecond = declaredPriorities.Any(
            priority => priority.Contains(secondToken, StringComparison.OrdinalIgnoreCase));

        if (prefersFirst && !prefersSecond)
        {
            return $"Prioritize {firstPositionLabel.ToLowerInvariant()} over {secondPositionLabel.ToLowerInvariant()}.";
        }

        if (prefersSecond && !prefersFirst)
        {
            return $"Prioritize {secondPositionLabel.ToLowerInvariant()} with explicit compensating controls.";
        }

        return $"Balance {firstDimension} and {secondDimension} with explicit human approval.";
    }
}
