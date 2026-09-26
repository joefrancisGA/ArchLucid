using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Analysis;

/// <summary>
///     Shared label/source-id heuristics for topology nodes that represent datastores.
/// </summary>
internal static class TopologyDatastoreLabelHeuristic
{
    public static bool IsRegulatedDatastoreTopologyNode(GraphNode node)
    {
        if (!IsTopologyResource(node))
        {
            return false;
        }

        if (HasDatastoreCategory(node))
        {
            return true;
        }

        string combined = BuildCombinedLabel(node);

        return combined.Contains("keyvault", StringComparison.Ordinal)
            || combined.Contains("key-vault", StringComparison.Ordinal)
            || DecisioningTextTokenMatcher.ContainsStandaloneToken(combined, "sql")
            || combined.Contains("storage", StringComparison.Ordinal)
            || combined.Contains("secret", StringComparison.Ordinal)
            || combined.Contains("cosmos", StringComparison.Ordinal)
            || combined.Contains("postgres", StringComparison.Ordinal)
            || combined.Contains("mysql", StringComparison.Ordinal)
            || combined.Contains("redis", StringComparison.Ordinal);
    }

    public static bool IsSkuRpoDatastoreTopologyNode(GraphNode node)
    {
        if (!IsTopologyResource(node))
        {
            return false;
        }

        if (HasDatastoreCategory(node))
        {
            return true;
        }

        string combined = BuildCombinedLabel(node);

        return DecisioningTextTokenMatcher.ContainsStandaloneToken(combined, "sql")
            || combined.Contains("storage", StringComparison.Ordinal)
            || combined.Contains("database", StringComparison.Ordinal)
            || combined.Contains("cosmos", StringComparison.Ordinal)
            || combined.Contains("redis", StringComparison.Ordinal)
            || combined.Contains("postgres", StringComparison.Ordinal)
            || combined.Contains("mysql", StringComparison.Ordinal)
            || IndicatesDatastoreCluster(combined);
    }

    private static bool IsTopologyResource(GraphNode node)
    {
        return string.Equals(node.NodeType, GraphNodeTypes.TopologyResource, StringComparison.OrdinalIgnoreCase);
    }

    private static bool HasDatastoreCategory(GraphNode node)
    {
        if (!TryGetProperty(node.Properties, "category", out string? category))
        {
            return false;
        }

        return string.Equals(category, GraphTopologyCategories.Data, StringComparison.OrdinalIgnoreCase)
            || string.Equals(category, GraphTopologyCategories.Storage, StringComparison.OrdinalIgnoreCase);
    }

    private static string BuildCombinedLabel(GraphNode node)
    {
        return $"{node.Label} {node.SourceId}".ToLowerInvariant();
    }

    private static bool IndicatesDatastoreCluster(string combined)
    {
        if (!combined.Contains("cluster", StringComparison.Ordinal))
        {
            return false;
        }

        return DecisioningTextTokenMatcher.ContainsStandaloneToken(combined, "sql")
            || combined.Contains("database", StringComparison.Ordinal)
            || combined.Contains("cosmos", StringComparison.Ordinal)
            || combined.Contains("redis", StringComparison.Ordinal)
            || combined.Contains("postgres", StringComparison.Ordinal)
            || combined.Contains("mysql", StringComparison.Ordinal)
            || combined.Contains("storage", StringComparison.Ordinal);
    }

    private static bool TryGetProperty(
        IReadOnlyDictionary<string, string> properties,
        string key,
        out string? value)
    {
        foreach (KeyValuePair<string, string> entry in properties)
        {
            if (string.Equals(entry.Key, key, StringComparison.OrdinalIgnoreCase)
                && !string.IsNullOrWhiteSpace(entry.Value))
            {
                value = entry.Value.Trim();

                return true;
            }
        }

        value = null;

        return false;
    }
}
