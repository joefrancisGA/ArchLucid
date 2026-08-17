using System.Text.Json;

using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Application.Analysis;

/// <summary>
///     Compares topology graph ARM identifiers to Azure extractor <c>resources.json</c> rows (TB-2216).
/// </summary>
public static class GraphAzureInventoryReconciliationAnalyzer
{
    /// <summary>
    ///     Topology property-bag keys that may hold the node's own Azure ARM resource id.
    ///     Terraform show JSON stores <c>values.id</c> as <c>tf.id</c> (and sometimes <c>tf.resource_id</c>),
    ///     not as <c>resourceId</c>.
    /// </summary>
    private static readonly string[] TopologyArmResourceIdPropertyKeys =
    [
        "resourceId",
        "azureResourceId",
        "armResourceId",
        "id",
        "tf.id",
        "tf.resource_id"
    ];

    public static InventoryReconciliationResult Analyze(string? resourcesJson, GraphSnapshot graphSnapshot)
    {
        ArgumentNullException.ThrowIfNull(graphSnapshot);

        HashSet<string> graphResourceIds = CollectGraphResourceIds(graphSnapshot);

        HashSet<string> inventoryResourceIds = string.IsNullOrWhiteSpace(resourcesJson)
            ? []
            : CollectInventoryResourceIds(resourcesJson);

        if (graphResourceIds.Count == 0 && inventoryResourceIds.Count == 0)
            return InventoryReconciliationResult.Empty;

        List<string> graphOnly = graphResourceIds
            .Except(inventoryResourceIds, StringComparer.OrdinalIgnoreCase)
            .OrderBy(static id => id, StringComparer.OrdinalIgnoreCase)
            .ToList();

        List<string> inventoryOnly = inventoryResourceIds
            .Except(graphResourceIds, StringComparer.OrdinalIgnoreCase)
            .OrderBy(static id => id, StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (graphOnly.Count == 0 && inventoryOnly.Count == 0)
            return InventoryReconciliationResult.Empty;

        return new InventoryReconciliationResult(
            graphResourceIds.Count,
            inventoryResourceIds.Count,
            graphOnly,
            inventoryOnly);
    }

    private static HashSet<string> CollectGraphResourceIds(GraphSnapshot graphSnapshot)
    {
        HashSet<string> ids = new(StringComparer.OrdinalIgnoreCase);

        foreach (GraphNode node in graphSnapshot.GetNodesByType(GraphNodeTypes.TopologyResource))
        {
            string? resourceId = TryReadTopologyResourceId(node);

            if (!string.IsNullOrWhiteSpace(resourceId))
                ids.Add(NormalizeArmResourceId(resourceId));
        }

        return ids;
    }

    internal static string? TryReadTopologyResourceId(GraphNode node)
    {
        ArgumentNullException.ThrowIfNull(node);

        if (node.Properties is not null)
        {
            foreach (string key in TopologyArmResourceIdPropertyKeys)
            {
                // SQL Ordinal bags keep persisted PropertyKey casing (ResourceId vs resourceId).
                if (TryGetPropertyIgnoreCase(node.Properties, key, out string? value)
                    && LooksLikeArmResourceId(value))
                    return value!.Trim();
            }
        }

        if (LooksLikeArmResourceId(node.SourceId))
            return node.SourceId!.Trim();

        return null;
    }

    private static bool TryGetPropertyIgnoreCase(
        IReadOnlyDictionary<string, string> properties,
        string key,
        out string? value)
    {
        if (properties.TryGetValue(key, out value))
            return true;

        foreach (KeyValuePair<string, string> pair in properties)
        {
            if (!string.Equals(pair.Key, key, StringComparison.OrdinalIgnoreCase))
                continue;

            value = pair.Value;
            return true;
        }

        value = null;
        return false;
    }

    private static HashSet<string> CollectInventoryResourceIds(string resourcesJson)
    {
        try
        {
            using JsonDocument document = JsonDocument.Parse(resourcesJson);

            if (document.RootElement.ValueKind is not JsonValueKind.Array)
                return [];

            HashSet<string> ids = new(StringComparer.OrdinalIgnoreCase);

            foreach (JsonElement row in document.RootElement.EnumerateArray())
            {
                if (!row.TryGetProperty("resourceId", out JsonElement idElement))
                    continue;

                string? resourceId = idElement.GetString()?.Trim();

                if (!LooksLikeArmResourceId(resourceId))
                    continue;

                ids.Add(NormalizeArmResourceId(resourceId!));
            }

            return ids;
        }
        catch (JsonException)
        {
            return [];
        }
    }

    internal static bool LooksLikeArmResourceId(string? value)
    {
        return !string.IsNullOrWhiteSpace(value)
               && value.Trim().StartsWith("/subscriptions/", StringComparison.OrdinalIgnoreCase);
    }

    internal static string NormalizeArmResourceId(string resourceId)
    {
        return resourceId.Trim().ToLowerInvariant();
    }
}

public sealed record InventoryReconciliationResult(
    int GraphTopologyResourceCount,
    int InventoryResourceCount,
    IReadOnlyList<string> GraphOnlyResourceIds,
    IReadOnlyList<string> InventoryOnlyResourceIds)
{
    public static InventoryReconciliationResult Empty { get; } = new(0, 0, [], []);

    public bool HasMismatches => GraphOnlyResourceIds.Count > 0 || InventoryOnlyResourceIds.Count > 0;
}
