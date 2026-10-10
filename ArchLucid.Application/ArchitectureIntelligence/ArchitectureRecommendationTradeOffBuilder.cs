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

        ArchitectureRecommendation target = FindRecommendationForTradeOff(recommendations, findings, firstDimension)
            ?? FindRecommendationForTradeOff(recommendations, findings, secondDimension)
            ?? throw new InvalidOperationException(
                $"No recommendation exists for trade-off dimensions {firstDimension} and {secondDimension}.");

        bool prefersFirst = PriorityListPrefersDimension(declaredPriorities, firstDimension);
        bool prefersSecond = PriorityListPrefersDimension(declaredPriorities, secondDimension);
        string preferredResolution = BuildPreferredResolution(
            prefersFirst,
            prefersSecond,
            firstPositionLabel,
            secondPositionLabel,
            firstDimension,
            secondDimension);

        target.TradeOffs.Add(new TradeOffObject
        {
            TradeOffId = ArchitectureRecommendationStableId.FromTradeOff(
                firstDimension,
                secondDimension,
                proposedDecision),
            ProposedDecision = proposedDecision,
            Benefit = benefit,
            CostOrRisk = costOrRisk,
            CompetingPositions = [firstPositionLabel, secondPositionLabel],
            RecommendedResolution = preferredResolution,
            ResolutionRationale = BuildResolutionRationale(
                prefersFirst,
                prefersSecond,
                firstDimension,
                secondDimension),
            RequiresHumanApproval = true,
        });
    }

    private static bool PriorityListPrefersDimension(
        IReadOnlyList<string> declaredPriorities,
        QualityDimension dimension)
    {
        string dimensionToken = dimension.ToString();

        return declaredPriorities.Any(priority => DeclaredPriorityPrefersDimension(priority, dimensionToken));
    }

    private static string BuildPreferredResolution(
        bool prefersFirst,
        bool prefersSecond,
        string firstPositionLabel,
        string secondPositionLabel,
        QualityDimension firstDimension,
        QualityDimension secondDimension)
    {
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

    // Closed-loop runs return this text on the recommendation. An unrelated priority did not select the pair.
    private static string BuildResolutionRationale(
        bool prefersFirst,
        bool prefersSecond,
        QualityDimension firstDimension,
        QualityDimension secondDimension)
    {
        if (prefersFirst || prefersSecond)
        {
            return $"Declared priorities were used to resolve competing {firstDimension} and {secondDimension} findings.";
        }

        return $"No declared priority selected {firstDimension} or {secondDimension}, so the competing findings stay balanced.";
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
            || CreateNegatedDimensionPattern("no", dimensionToken).IsMatch(priority)
            || CreateNegatedDimensionPattern("not", dimensionToken).IsMatch(priority)
            || CreateNegatedDimensionPattern("anti", dimensionToken).IsMatch(priority)
            || CreateWithoutDimensionPattern(dimensionToken).IsMatch(priority)
            || CreateExcludingDimensionPattern(dimensionToken).IsMatch(priority)
            || CreateExceptDimensionPattern(dimensionToken).IsMatch(priority)
            || CreateAvoidDimensionPattern(dimensionToken).IsMatch(priority)
            || CreateOmitDimensionPattern(dimensionToken).IsMatch(priority);
    }

    private static Regex CreateAvoidDimensionPattern(string dimensionToken)
    {
        return new Regex(
            $@"\bavoid(?:s|ed|ing)?\s+{Regex.Escape(dimensionToken)}\b",
            RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);
    }

    private static Regex CreateOmitDimensionPattern(string dimensionToken)
    {
        return new Regex(
            $@"\bomit(?:s|ted|ting)?\s+{Regex.Escape(dimensionToken)}\b",
            RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);
    }

    private static Regex CreateExceptDimensionPattern(string dimensionToken)
    {
        return new Regex(
            $@"\bexcept\s+{Regex.Escape(dimensionToken)}\b",
            RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);
    }

    private static Regex CreateExcludingDimensionPattern(string dimensionToken)
    {
        return new Regex(
            $@"\bexclud(?:e|es|ed|ing)\s+{Regex.Escape(dimensionToken)}\b",
            RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);
    }

    private static Regex CreateWithoutDimensionPattern(string dimensionToken)
    {
        return new Regex(
            $@"\bwithout\s+{Regex.Escape(dimensionToken)}\b",
            RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);
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
            $@"\b{Regex.Escape(dimensionToken)}\b",
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

    private static ArchitectureRecommendation? FindRecommendationForTradeOff(
        IReadOnlyList<ArchitectureRecommendation> recommendations,
        IReadOnlyList<SpecialistReviewFinding> findings,
        QualityDimension dimension)
    {
        string dimensionLabel = dimension.ToString();

        foreach (SpecialistReviewFinding finding in findings)
        {
            if (finding.Dimension != dimension || !IsActionableForTradeOff(finding))
                continue;

            ArchitectureRecommendation? match = recommendations.FirstOrDefault(
                recommendation => recommendation.AffectedRequirementOrQualityAttribute.Equals(
                    dimensionLabel,
                    StringComparison.Ordinal)
                    && string.Equals(recommendation.Problem, finding.Title, StringComparison.Ordinal));

            if (match is not null)
                return match;
        }

        return recommendations.FirstOrDefault(
            recommendation => recommendation.AffectedRequirementOrQualityAttribute.Equals(
                dimensionLabel,
                StringComparison.Ordinal));
    }
}
