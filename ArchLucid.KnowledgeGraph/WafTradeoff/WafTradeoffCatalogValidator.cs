namespace ArchLucid.KnowledgeGraph.WafTradeoff;

public static class WafTradeoffCatalogValidator
{
    public static void Validate(IReadOnlyList<WafTradeoffCatalogEntry> entries)
    {
        if (entries.Count == 0)
            throw new InvalidOperationException("WAF tradeoff catalog must contain at least one entry.");

        HashSet<string> mechanismKeys = new(StringComparer.OrdinalIgnoreCase);

        foreach (WafTradeoffCatalogEntry entry in entries)
        {
            if (string.IsNullOrWhiteSpace(entry.MechanismKey))
                throw new InvalidOperationException("WAF tradeoff catalog entry is missing mechanismKey.");

            if (!mechanismKeys.Add(entry.MechanismKey))
            {
                throw new InvalidOperationException(
                    $"WAF tradeoff catalog contains duplicate mechanismKey '{entry.MechanismKey}'.");
            }
        }

        foreach (WafTradeoffCatalogEntry entry in entries)
        {
            if (string.IsNullOrWhiteSpace(entry.CounterfactualKey))
                continue;

            if (!mechanismKeys.Contains(entry.CounterfactualKey))
            {
                throw new InvalidOperationException(
                    $"WAF tradeoff catalog entry '{entry.MechanismKey}' references missing counterfactualKey '{entry.CounterfactualKey}'.");
            }
        }
    }
}
