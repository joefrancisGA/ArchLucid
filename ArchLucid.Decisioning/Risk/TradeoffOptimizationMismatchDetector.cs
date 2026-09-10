using ArchLucid.Contracts.Risk;

namespace ArchLucid.Decisioning.Risk;

internal static class TradeoffOptimizationMismatchDetector
{
    private static readonly IReadOnlyDictionary<WafPillar, string[]> OutcomePillarPhrases =
        new Dictionary<WafPillar, string[]>
        {
            [WafPillar.Reliability] = ["improve reliability", "increase reliability", "higher reliability", "more reliable"],
            [WafPillar.Security] = ["improve security", "strengthen security", "more secure"],
            [WafPillar.Cost] = ["reduce cost", "lower cost", "cost optimization", "save money"],
            [WafPillar.Operations] = ["improve operations", "operational excellence", "reduce toil"],
            [WafPillar.Performance] = ["improve performance", "faster", "lower latency", "higher throughput"],
        };

    public static WafPillar? ResolveOutcomePillar(string? businessOutcome)
    {
        if (string.IsNullOrWhiteSpace(businessOutcome))
            return null;

        string normalizedOutcome = businessOutcome.ToLowerInvariant();

        foreach (KeyValuePair<WafPillar, string[]> entry in OutcomePillarPhrases)
        {
            foreach (string phrase in entry.Value)
            {
                if (normalizedOutcome.Contains(phrase, StringComparison.Ordinal))
                    return entry.Key;
            }
        }

        return null;
    }

    public static WafPillar? ResolveDominantSacrificedPillar(IReadOnlyList<ArchitectureTradeoff> tradeoffs)
    {
        if (tradeoffs.Count == 0)
            return null;

        Dictionary<WafPillar, int> counts = new();

        foreach (ArchitectureTradeoff tradeoff in tradeoffs)
        {
            counts.TryGetValue(tradeoff.SacrificedPillar, out int current);
            counts[tradeoff.SacrificedPillar] = current + 1;
        }

        return counts
            .OrderByDescending(static pair => pair.Value)
            .ThenBy(static pair => pair.Key)
            .Select(static pair => pair.Key)
            .FirstOrDefault();
    }

    public static void ApplyRelatedOutcomeRefs(
        IReadOnlyList<ArchitectureTradeoff> tradeoffs,
        string? businessOutcome,
        WafPillar? outcomePillar,
        WafPillar? dominantSacrificedPillar)
    {
        if (string.IsNullOrWhiteSpace(businessOutcome))
            return;

        if (outcomePillar is null || dominantSacrificedPillar is null)
            return;

        if (outcomePillar != dominantSacrificedPillar)
            return;

        foreach (ArchitectureTradeoff tradeoff in tradeoffs)
        {
            if (tradeoff.SacrificedPillar != dominantSacrificedPillar)
                continue;

            tradeoff.RelatedOutcomeRef = "businessOutcome";
        }
    }
}
