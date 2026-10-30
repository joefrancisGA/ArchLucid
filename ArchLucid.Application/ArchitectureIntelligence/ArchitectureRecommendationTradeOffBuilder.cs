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

        bool prefersFirst;
        bool prefersSecond;
        if (TryResolveDeclaredPairPrecedence(
                declaredPriorities,
                firstDimension,
                secondDimension,
                out bool explicitPrefersFirstDimension))
        {
            prefersFirst = explicitPrefersFirstDimension;
            prefersSecond = !explicitPrefersFirstDimension;
        }
        else
        {
            prefersFirst = PriorityListPrefersDimension(declaredPriorities, firstDimension);
            prefersSecond = PriorityListPrefersDimension(declaredPriorities, secondDimension);
        }

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

        if (TryResolveExplicitDimensionPrecedence(priority, dimensionToken, out bool explicitPrefers))
            return explicitPrefers;

        if (!CreateDimensionWordPattern(dimensionToken).IsMatch(priority))
            return false;

        if (dimensionToken.Equals("Cost", StringComparison.OrdinalIgnoreCase)
            && (IsCostTokenInHyphenatedCompoundAdjective(priority)
                || IsCostTokenInSpacedModifierPhrase(priority)
                || IsCostTokenInEconomyModifierPhrase(priority)
                || IsCostTokenInPrepositionalCostPhrase(priority)
                || IsCostTokenInCostCenterPhrase(priority)
                || IsCostTokenInQualifiedCostNounPhrase(priority)
                || IsCostTokenInPerQualifierCostPhrase(priority)
                || IsCostTokenInMultiWordQualifiedCostPhrase(priority)
                || IsCostTokenInCostOfDimensionGoalPhrase(priority)
                || IsCostTokenInPriceOfDimensionGoalPhrase(priority)))
        {
            return false;
        }

        return true;
    }

    private static bool IsCostTokenInSpacedModifierPhrase(string priority) =>
        Regex.IsMatch(
            priority,
            @"\bCost\s+(optimized|optimization|optimizing|effective|efficiency|efficient|conscious|control|controls|containment|savings?|reduction|reducing|management|governance)\b",
            RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);

    private static bool IsCostTokenInEconomyModifierPhrase(string priority) =>
        Regex.IsMatch(
            priority,
            @"\b(?:low|minimal|reduced|cheaper)\s+cost\b",
            RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);

    private static bool IsCostTokenInPrepositionalCostPhrase(string priority) =>
        Regex.IsMatch(
            priority,
            @"\b(?:at|for|on)\s+cost\b",
            RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);

    private static bool IsCostTokenInCostCenterPhrase(string priority) =>
        Regex.IsMatch(
            priority,
            @"\bcost\s+center\b",
            RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);

    private static bool IsCostTokenInQualifiedCostNounPhrase(string priority) =>
        Regex.IsMatch(
            priority,
            @"\b(?:unit|total|marginal|average|variable|incremental|fixed|direct|opportunity|capital|sunk|lifecycle|operating|carrying)\s+cost\b",
            RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);

    private static bool IsCostTokenInPerQualifierCostPhrase(string priority) =>
        Regex.IsMatch(
            priority,
            @"\bper\s+\w+\s+cost\b",
            RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);

    private static bool IsCostTokenInMultiWordQualifiedCostPhrase(string priority) =>
        Regex.IsMatch(
            priority,
            @"\b(?:fully\s+loaded|total\s+landed)\s+cost\b",
            RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);

    private static bool IsCostTokenInCostOfDimensionGoalPhrase(string priority) =>
        Regex.IsMatch(
            priority,
            @"\bcost\s+of\s+(?:security|reliability|operations|compliance|ownership|delivery|quality)\b",
            RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);

    private static bool IsCostTokenInPriceOfDimensionGoalPhrase(string priority) =>
        Regex.IsMatch(
            priority,
            @"\bprice\s+of\s+(?:security|reliability|operations|compliance)\b",
            RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);

    private static bool TryResolveDeclaredPairPrecedence(
        IReadOnlyList<string> declaredPriorities,
        QualityDimension firstDimension,
        QualityDimension secondDimension,
        out bool prefersFirstDimension)
    {
        prefersFirstDimension = false;
        bool found = false;
        string firstToken = firstDimension.ToString();
        string secondToken = secondDimension.ToString();

        foreach (string priority in declaredPriorities)
        {
            if (string.IsNullOrWhiteSpace(priority))
                continue;

            Match? match = ExplicitDimensionOverDimensionPattern().Match(priority);

            if (!match.Success)
                match = ExplicitDimensionBeforeDimensionPattern().Match(priority);

            if (!match.Success)
                continue;

            string left = match.Groups[1].Value;
            string right = match.Groups[2].Value;

            // "Do not prefer Security over Cost" still matches the pair pattern. Honor the same
            // negation helper the generic dimension path uses, or the left side wins anyway.
            if (IsNegatedDimensionMention(priority, left))
                continue;

            if (left.Equals(firstToken, StringComparison.OrdinalIgnoreCase)
                && right.Equals(secondToken, StringComparison.OrdinalIgnoreCase))
            {
                prefersFirstDimension = true;
                found = true;
            }
            else if (left.Equals(secondToken, StringComparison.OrdinalIgnoreCase)
                && right.Equals(firstToken, StringComparison.OrdinalIgnoreCase))
            {
                prefersFirstDimension = false;
                found = true;
            }
        }

        return found;
    }

    private static bool IsCostTokenInHyphenatedCompoundAdjective(string priority)
    {
        Match match = Regex.Match(
            priority,
            @"\bCost[-\u2010\u2011\u2012\u2013\u2014\u2015\u2212\uFE58\uFE63\uFF0D]([\p{L}\p{N}]+)",
            RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);

        if (!match.Success)
            return false;

        string hyphenSuffix = match.Groups[1].Value;

        if (hyphenSuffix.Equals("first", StringComparison.OrdinalIgnoreCase))
            return false;

        return true;
    }

    private static bool TryResolveExplicitDimensionPrecedence(
        string priority,
        string dimensionToken,
        out bool prefersDimension)
    {
        prefersDimension = false;

        Match? match = ExplicitDimensionOverDimensionPattern().Match(priority);

        if (!match.Success)
            match = ExplicitDimensionBeforeDimensionPattern().Match(priority);

        if (!match.Success)
            return false;

        string left = match.Groups[1].Value;
        string right = match.Groups[2].Value;

        if (dimensionToken.Equals(left, StringComparison.OrdinalIgnoreCase))
        {
            prefersDimension = true;

            return true;
        }

        if (dimensionToken.Equals(right, StringComparison.OrdinalIgnoreCase))
        {
            prefersDimension = false;

            return true;
        }

        return false;
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
            || CreateOmitDimensionPattern(dimensionToken).IsMatch(priority)
            || CreateExplicitDeprioritizationPattern(dimensionToken).IsMatch(priority)
            || CreateBareDeprioritizeDimensionPattern(dimensionToken).IsMatch(priority)
            || CreatePostpositiveNegationPattern(dimensionToken).IsMatch(priority);
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

    private static Regex CreateExplicitDeprioritizationPattern(string dimensionToken)
    {
        return new Regex(
            $@"\b(?:do\s+not|don['’]t)\s+(?:depriorit(?:ize|ise)|priorit(?:y|ize|ise)|select|favor|favour|prefer|rank)\s+{Regex.Escape(dimensionToken)}\b",
            RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);
    }

    private static Regex CreateBareDeprioritizeDimensionPattern(string dimensionToken)
    {
        return new Regex(
            $@"\bdepriorit(?:ize|ise)(?:s|d)?\s+{Regex.Escape(dimensionToken)}\b",
            RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);
    }

    private static Regex CreatePostpositiveNegationPattern(string dimensionToken)
    {
        return new Regex(
            $@"\b{Regex.Escape(dimensionToken)}\s+(?:is\s+not|isn['’]t)\s+(?:a\s+)?(?:priority|prioritized|prioritised)\b",
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

    private static Regex ExplicitDimensionOverDimensionPattern() =>
        new(
            @"\b(Security|Cost|Reliability)\s+over\s+(Security|Cost|Reliability)\b",
            RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);

    private static Regex ExplicitDimensionBeforeDimensionPattern() =>
        new(
            @"\b(Security|Cost|Reliability)\s+before\s+(Security|Cost|Reliability)\b",
            RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);

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
