using System.Text.Json;

using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Application.Analysis;

/// <summary>
///     Compares topology graph GCP resource identifiers to cloud inventory <c>resources.json</c> rows (TB-2248).
/// </summary>
public static class GraphGcpInventoryReconciliationAnalyzer
{
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

        bool inventorySnapshotAbsent = string.IsNullOrWhiteSpace(resourcesJson);

        return new InventoryReconciliationResult(
            graphResourceIds.Count,
            inventoryResourceIds.Count,
            graphOnly,
            inventoryOnly,
            inventorySnapshotAbsent);
    }

    private static HashSet<string> CollectGraphResourceIds(GraphSnapshot graphSnapshot)
    {
        HashSet<string> ids = new(StringComparer.OrdinalIgnoreCase);

        foreach (GraphNode node in graphSnapshot.GetNodesByType(GraphNodeTypes.TopologyResource))
        {
            string? resourceId = TryReadTopologyResourceId(node);

            if (!string.IsNullOrWhiteSpace(resourceId))
                ids.Add(NormalizeGcpResourceId(resourceId));
        }

        return ids;
    }

    internal static string? TryReadTopologyResourceId(GraphNode node)
    {
        ArgumentNullException.ThrowIfNull(node);

        if (node.Properties is not null)
        {
            foreach (string key in new[]
                     {
                         "gcpResourceId",
                         "resourceName",
                         "name",
                         "resourceId",
                         "id",
                         "tf.id",
                         "tf.resource_id",
                     })
            {
                // SQL Ordinal bags keep persisted PropertyKey casing (GcpResourceId vs gcpResourceId).
                if (TryGetPropertyIgnoreCase(node.Properties, key, out string? value)
                    && LooksLikeGcpResourceId(value))
                    return value!.Trim();
            }
        }

        if (LooksLikeGcpResourceId(node.SourceId))
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

            HashSet<string> ids = new(StringComparer.OrdinalIgnoreCase);

            foreach (JsonElement row in InventoryResourcesJsonRowReader.EnumerateResourceRows(document.RootElement))
            {
                string? resourceId = TryReadInventoryResourceId(row);

                if (!LooksLikeGcpResourceId(resourceId))
                    continue;

                ids.Add(NormalizeGcpResourceId(resourceId!));
            }

            return ids;
        }
        catch (JsonException)
        {
            return [];
        }
    }

    private static string? TryReadInventoryResourceId(JsonElement row)
    {
        string? value = InventoryResourcesJsonRowReader.TryGetTrimmedString(
            row,
            ["name", "resourceName", "gcpResourceId", "resourceId", "selfLink", "tf.id", "tf.resource_id"]);

        return LooksLikeGcpResourceId(value) ? value : null;
    }

    internal static bool LooksLikeGcpResourceId(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return false;

        string trimmed = value.Trim();

        return trimmed.StartsWith("projects/", StringComparison.OrdinalIgnoreCase)
               || trimmed.StartsWith("//", StringComparison.Ordinal)
               || trimmed.Contains(".googleapis.com/", StringComparison.OrdinalIgnoreCase);
    }

    internal static string NormalizeGcpResourceId(string resourceId)
    {
        string trimmed = resourceId.Trim().ToLowerInvariant();

        int projectsIndex = trimmed.IndexOf("/projects/", StringComparison.Ordinal);
        if (projectsIndex >= 0)
            return trimmed[(projectsIndex + 1)..];

        if (trimmed.StartsWith("//", StringComparison.Ordinal))
        {
            int servicePathIndex = trimmed.IndexOf(".googleapis.com/", StringComparison.Ordinal);

            if (servicePathIndex >= 0)
            {
                return trimmed[(servicePathIndex + ".googleapis.com/".Length)..];
            }
        }

        return trimmed;
    }
}
