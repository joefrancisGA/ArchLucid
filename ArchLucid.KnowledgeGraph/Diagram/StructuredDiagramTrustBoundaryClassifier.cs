namespace ArchLucid.KnowledgeGraph.Diagram;

/// <summary>
///     Classifies diagram swimlane / subgraph labels as trust-boundary hints (AS-020).
/// </summary>
public static class StructuredDiagramTrustBoundaryClassifier
{
    private static readonly string[] DecorativeLaneTokens =
    [
        "legend",
        "title",
        "caption",
        "figure",
        "diagram key",
        "key",
        "notes",
        "note",
        "todo",
        "copyright",
    ];

    private static readonly string[] TrustBoundaryTokens =
    [
        "trust boundary",
        "trust zone",
        "security zone",
        "security boundary",
        "corporate network",
        "private network",
        "private subnet",
        "public subnet",
        "virtual network",
        "vnet",
        "subnet",
        "subscription",
        "resource group",
        "dmz",
        "perimeter",
        "enclave",
        "segment",
        "landing zone",
        "hub network",
        "spoke network",
        "on-premises",
        "on prem",
        "internet",
        "extranet",
        "intranet",
    ];

    public static bool IsTrustBoundaryHint(string? subgraphLabel)
    {
        if (string.IsNullOrWhiteSpace(subgraphLabel))
        {
            return false;
        }

        string normalized = Normalize(subgraphLabel);

        if (IsDecorativeLane(normalized))
        {
            return false;
        }

        return ContainsAny(normalized, TrustBoundaryTokens);
    }

    public static string ResolveSubgraphLabel(string subgraphId, string? subgraphLabel)
    {
        if (!string.IsNullOrWhiteSpace(subgraphLabel))
        {
            return subgraphLabel.Trim();
        }

        return subgraphId.Trim();
    }

    private static bool IsDecorativeLane(string normalizedLabel)
    {
        foreach (string token in DecorativeLaneTokens)
        {
            if (string.Equals(normalizedLabel, token, StringComparison.Ordinal)
                || normalizedLabel.StartsWith($"{token} ", StringComparison.Ordinal)
                || normalizedLabel.EndsWith($" {token}", StringComparison.Ordinal))
            {
                return true;
            }
        }

        return false;
    }

    private static string Normalize(string label)
    {
        return label.Trim().ToLowerInvariant();
    }

    private static bool ContainsAny(string normalizedLabel, IReadOnlyList<string> tokens)
    {
        foreach (string token in tokens)
        {
            if (normalizedLabel.Contains(token, StringComparison.Ordinal))
            {
                return true;
            }
        }

        return false;
    }
}
