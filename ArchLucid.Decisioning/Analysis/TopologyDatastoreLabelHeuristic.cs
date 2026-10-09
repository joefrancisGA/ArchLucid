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

        return ContainsAffirmativeDelimiterToken(combined, "keyvault")
            || DecisioningTextTokenMatcher.ContainsPattern(combined, "key-vault")
            || DecisioningTextTokenMatcher.ContainsStandaloneToken(combined, "sql")
            || ContainsAffirmativeStorageKeyword(combined)
            || ContainsAffirmativeSecretKeyword(combined)
            || ContainsAffirmativeDelimiterToken(combined, "cosmos")
            || ContainsAffirmativeDelimiterToken(combined, "postgres")
            || ContainsAffirmativeDelimiterToken(combined, "mysql")
            || ContainsAffirmativeDelimiterToken(combined, "redis");
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
            || ContainsAffirmativeStorageKeyword(combined)
            || ContainsAffirmativeDatabaseKeyword(combined)
            || ContainsAffirmativeDelimiterToken(combined, "cosmos")
            || ContainsAffirmativeDelimiterToken(combined, "redis")
            || ContainsAffirmativeDelimiterToken(combined, "postgres")
            || ContainsAffirmativeDelimiterToken(combined, "mysql")
            || IndicatesDatastoreCluster(combined);
    }

    private static bool IsTopologyResource(GraphNode node)
    {
        return string.Equals(node.NodeType, GraphNodeTypes.TopologyResource, StringComparison.OrdinalIgnoreCase);
    }

    private static bool HasDatastoreCategory(GraphNode node)
    {
        // Inventory writes GraphNode.Category from the ARM type. Data Factory and Synapse
        // share the data diagram category but are pipelines, not replica targets.
        if (IsDataIntegrationArmResource(node))
        {
            return false;
        }

        if (IsDataOrStorageCategory(node.Category))
        {
            return true;
        }

        if (!TryGetProperty(node.Properties, "category", out string? category))
        {
            return false;
        }

        return IsDataOrStorageCategory(category);
    }

    private static bool IsDataOrStorageCategory(string? category)
    {
        return string.Equals(category, GraphTopologyCategories.Data, StringComparison.OrdinalIgnoreCase)
            || string.Equals(category, GraphTopologyCategories.Storage, StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsDataIntegrationArmResource(GraphNode node)
    {
        string sourceId = node.SourceId ?? string.Empty;

        return sourceId.Contains("Microsoft.DataFactory/", StringComparison.OrdinalIgnoreCase)
            || sourceId.Contains("Microsoft.Synapse/", StringComparison.OrdinalIgnoreCase);
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
            || ContainsAffirmativeDatabaseKeyword(combined)
            || ContainsAffirmativeDelimiterToken(combined, "cosmos")
            || ContainsAffirmativeDelimiterToken(combined, "redis")
            || ContainsAffirmativeDelimiterToken(combined, "postgres")
            || ContainsAffirmativeDelimiterToken(combined, "mysql")
            || ContainsAffirmativeStorageKeyword(combined);
    }

    internal static bool ContainsAffirmativeDatabaseKeyword(string text) =>
        ContainsAffirmativeDelimiterToken(text, "database");

    internal static bool ContainsAffirmativeStorageKeyword(string text) =>
        ContainsAffirmativeDelimiterToken(text, "storage");

    internal static bool ContainsAffirmativeBlobKeyword(string text) =>
        ContainsAffirmativeDelimiterToken(text, "blob");

    internal static bool ContainsAffirmativeDelimiterToken(string text, string token)
    {
        string[] parts = text.Split(['/', '.', '_', ':', ' ', '-'], StringSplitOptions.RemoveEmptyEntries);

        for (int index = 0; index < parts.Length; index++)
        {
            if (!parts[index].Equals(token, StringComparison.Ordinal))
            {
                continue;
            }

            if (index > 0 && parts[index - 1].Equals("non", StringComparison.Ordinal))
            {
                continue;
            }

            return true;
        }

        return false;
    }

    private static bool ContainsAffirmativeSecretKeyword(string text)
    {
        if (!DecisioningTextTokenMatcher.ContainsStandaloneToken(text, "secret"))
        {
            return false;
        }

        if (text.Contains("non-secret", StringComparison.Ordinal)
            || text.Contains("non secret", StringComparison.Ordinal))
        {
            return false;
        }

        return true;
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
