using System.Text.Json;

using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Application.Analysis;

/// <summary>
///     Compares topology graph AWS resource identifiers to cloud inventory <c>resources.json</c> rows (TB-2248).
/// </summary>
public static class GraphAwsInventoryReconciliationAnalyzer
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
                ids.Add(NormalizeAwsResourceId(resourceId));
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
                         "awsResourceId",
                         "arn",
                         "resourceArn",
                         "identifier",
                         "resourceId",
                         "id",
                         "name",
                         "tf.id",
                         "tf.arn",
                         "tf.resource_id",
                     })
            {
                // SQL Ordinal bags keep persisted PropertyKey casing (AwsResourceId vs awsResourceId).
                if (TryGetPropertyIgnoreCase(node.Properties, key, out string? value)
                    && LooksLikeAwsResourceId(value))
                    return value!.Trim();
            }

            foreach (string configurationPropertyName in new[] { "configuration", "supplementaryConfiguration" })
            {
                if (!TryGetPropertyIgnoreCase(node.Properties, configurationPropertyName, out string? configurationJson)
                    || !TryReadAwsResourceIdFromSerializedConfiguration(configurationJson, out string? configurationArn)
                    || !LooksLikeAwsResourceId(configurationArn))
                    continue;

                return configurationArn!.Trim();
            }
        }

        if (LooksLikeAwsResourceId(node.SourceId))
            return node.SourceId!.Trim();

        return null;
    }

    private static bool TryReadAwsResourceIdFromSerializedConfiguration(string? configurationJson, out string? resourceId)
    {
        resourceId = null;

        if (string.IsNullOrWhiteSpace(configurationJson))
            return false;

        string trimmed = configurationJson.Trim();

        if (trimmed.Length < 2 || trimmed[0] is not '{')
            return false;

        try
        {
            using JsonDocument document = JsonDocument.Parse(trimmed);

            resourceId = InventoryResourcesJsonRowReader.TryGetTrimmedString(
                document.RootElement,
                ["arn", "resourceArn", "awsResourceId", "identifier", "id", "name", "tf.arn", "tf.id", "tf.resource_id"]);

            return !string.IsNullOrWhiteSpace(resourceId);
        }
        catch (JsonException)
        {
            return false;
        }
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

                if (!LooksLikeAwsResourceId(resourceId))
                    continue;

                ids.Add(NormalizeAwsResourceId(resourceId!));
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
            [
                "name",
                "resourceName",
                "arn",
                "resourceArn",
                "awsResourceId",
                "identifier",
                "id",
                "tf.id",
                "tf.arn",
                "tf.resource_id",
            ]);

        return LooksLikeAwsResourceId(value) ? value : null;
    }

    internal static bool LooksLikeAwsResourceId(string? value)
    {
        return !string.IsNullOrWhiteSpace(value)
               && value.Trim().StartsWith("arn:", StringComparison.OrdinalIgnoreCase);
    }

    internal static string NormalizeAwsResourceId(string resourceId)
    {
        return resourceId.Trim().ToLowerInvariant();
    }
}
