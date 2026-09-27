using System.Text.RegularExpressions;

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
            finding => finding.Dimension == firstDimension && IsActionableForTradeOff(finding));
        bool hasSecondFinding = findings.Any(
            finding => finding.Dimension == secondDimension && IsActionableForTradeOff(finding));

        if (!hasFirstFinding || !hasSecondFinding)
        {
            return;
        }

        ArchitectureRecommendation target = FindRecommendationForDimension(recommendations, firstDimension)
            ?? FindRecommendationForDimension(recommendations, secondDimension)
            ?? throw new InvalidOperationException(
                $"No recommendation exists for trade-off dimensions {firstDimension} and {secondDimension}.");

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
            priority => DeclaredPriorityPrefersDimension(priority, firstToken));
        bool prefersSecond = declaredPriorities.Any(
            priority => DeclaredPriorityPrefersDimension(priority, secondToken));

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

    private static bool DeclaredPriorityPrefersDimension(string priority, string dimensionToken)
    {
        if (string.IsNullOrWhiteSpace(priority) || string.IsNullOrWhiteSpace(dimensionToken))
            return false;

        if (IsNegatedDimensionMention(priority, dimensionToken))
            return false;

        return CreateDimensionWordPattern(dimensionToken).IsMatch(priority);
    }

    private static bool IsNegatedDimensionMention(string priority, string dimensionToken)
    {
        if (string.IsNullOrWhiteSpace(dimensionToken))
            return false;

        if (dimensionToken.Equals("Reliability", StringComparison.OrdinalIgnoreCase)
            && UnreliabilityNegationPattern().IsMatch(priority))
        {
            return true;
        }

        return CreateNegatedDimensionPattern("non", dimensionToken).IsMatch(priority)
            || CreateNegatedDimensionPattern("no", dimensionToken).IsMatch(priority);
    }

    private static Regex CreateNegatedDimensionPattern(string negationPrefix, string dimensionToken)
    {
        return new Regex(
            $@"\b{negationPrefix}[-\s]?{Regex.Escape(dimensionToken)}\b",
            RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);
    }

    private static Regex CreateDimensionWordPattern(string dimensionToken)
    {
        return new Regex(
            $"(?:^|[^A-Za-z]){Regex.Escape(dimensionToken)}(?:$|[^A-Za-z])",
            RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);
    }

    private static Regex UnreliabilityNegationPattern() =>
        new(@"\bunreliability\b", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);

    private static bool IsActionableForTradeOff(SpecialistReviewFinding finding)
    {
        if (finding.Conclusion is not (ReviewConclusion.Fail or ReviewConclusion.Indeterminate))
            return false;

        return ProvenancePresentationMapper.MapFinding(finding) != ProvenancePresentationBucket.Unverified;
    }

    private static ArchitectureRecommendation? FindRecommendationForDimension(
        IReadOnlyList<ArchitectureRecommendation> recommendations,
        QualityDimension dimension)
    {
        string dimensionLabel = dimension.ToString();

        return recommendations.FirstOrDefault(
            recommendation => recommendation.AffectedRequirementOrQualityAttribute.Equals(
                dimensionLabel,
                StringComparison.Ordinal));
    }
}
