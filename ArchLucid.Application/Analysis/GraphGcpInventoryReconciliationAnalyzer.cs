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
                ids.Add(NormalizeGcpResourceId(resourceId));
        }

        return ids;
    }

    internal static string? TryReadTopologyResourceId(GraphNode node)
    {
        foreach (string key in new[] { "gcpResourceId", "resourceName", "name", "resourceId", "id" })
        {
            if (node.Properties.TryGetValue(key, out string? value) && LooksLikeGcpResourceId(value))
                return value.Trim();
        }

        if (LooksLikeGcpResourceId(node.SourceId))
            return node.SourceId!.Trim();

        return null;
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
                if (!row.TryGetProperty("name", out JsonElement nameElement))
                    continue;

                string? resourceId = nameElement.GetString()?.Trim();

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
        return resourceId.Trim().ToLowerInvariant();
    }
}
