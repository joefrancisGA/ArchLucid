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
        "selfLink",
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

            string? fromSubscriptionAndRelativeId =
                TryCombineSubscriptionIdAndRelativeResourceIdFromProperties(node.Properties);

            if (LooksLikeArmResourceId(fromSubscriptionAndRelativeId))
                return fromSubscriptionAndRelativeId!.Trim();
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
            JsonElement root = document.RootElement;

            HashSet<string> ids = new(StringComparer.OrdinalIgnoreCase);

            foreach (JsonElement row in InventoryResourcesJsonRowReader.EnumerateResourceRows(root))
            {
                JsonElement effectiveRow = row;

                if (InventoryResourcesJsonRowReader.TryResolveIncludedResourceRow(root, row, out JsonElement includedRow))
                    effectiveRow = includedRow;

                string? resourceId = TryReadInventoryResourceId(effectiveRow);

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

    private static string? TryReadInventoryResourceId(JsonElement row)
    {
        string? value = InventoryResourcesJsonRowReader.TryGetTrimmedString(
            row,
            [
                "resourceId",
                "id",
                "resourceName",
                "azureResourceId",
                "armResourceId",
                "selfLink",
                "tf.id",
                "tf.resource_id",
            ]);

        if (LooksLikeArmResourceId(value))
            return value;

        return TryCombineSubscriptionIdAndRelativeResourceId(row);
    }

    private static string? TryCombineSubscriptionIdAndRelativeResourceId(JsonElement row)
    {
        string? subscriptionId = InventoryResourcesJsonRowReader.TryGetTrimmedString(row, ["subscriptionId"]);
        string? relativeId = TryGetRelativeArmSegment(row);

        return TryCombineSubscriptionIdAndRelativeResourceId(subscriptionId, relativeId);
    }

    private static string? TryCombineSubscriptionIdAndRelativeResourceIdFromProperties(
        IReadOnlyDictionary<string, string> properties)
    {
        if (!TryGetPropertyIgnoreCase(properties, "subscriptionId", out string? subscriptionId))
            return null;

        string? relativeId = TryGetRelativeArmSegmentFromProperties(properties);

        return TryCombineSubscriptionIdAndRelativeResourceId(subscriptionId, relativeId);
    }

    private static string? TryGetRelativeArmSegment(JsonElement row)
    {
        string? relativeId = InventoryResourcesJsonRowReader.TryGetTrimmedString(row, ["id"]);

        if (!string.IsNullOrWhiteSpace(relativeId))
            return relativeId;

        relativeId = InventoryResourcesJsonRowReader.TryGetTrimmedString(row, ["resourceId"]);

        return string.IsNullOrWhiteSpace(relativeId) ? null : relativeId;
    }

    private static string? TryGetRelativeArmSegmentFromProperties(IReadOnlyDictionary<string, string> properties)
    {
        if (TryGetPropertyIgnoreCase(properties, "id", out string? relativeId)
            && !string.IsNullOrWhiteSpace(relativeId))
            return relativeId;

        if (TryGetPropertyIgnoreCase(properties, "resourceId", out relativeId)
            && !string.IsNullOrWhiteSpace(relativeId))
            return relativeId;

        return null;
    }

    private static string? TryCombineSubscriptionIdAndRelativeResourceId(string? subscriptionId, string? relativeId)
    {
        if (string.IsNullOrWhiteSpace(subscriptionId) || string.IsNullOrWhiteSpace(relativeId))
            return null;

        string trimmedRelative = relativeId.Trim();

        if (trimmedRelative.StartsWith("/subscriptions/", StringComparison.OrdinalIgnoreCase)
            || trimmedRelative.StartsWith("subscriptions/", StringComparison.OrdinalIgnoreCase)
            || trimmedRelative.Contains("management.azure.com/", StringComparison.OrdinalIgnoreCase))
            return null;

        string combined =
            $"/subscriptions/{subscriptionId.Trim()}/{trimmedRelative.TrimStart('/')}";

        return LooksLikeArmResourceId(combined) ? combined : null;
    }

    internal static bool LooksLikeArmResourceId(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return false;

        string trimmed = value.Trim();

        return trimmed.StartsWith("/subscriptions/", StringComparison.OrdinalIgnoreCase)
               || trimmed.StartsWith("subscriptions/", StringComparison.OrdinalIgnoreCase)
               || trimmed.Contains("management.azure.com/", StringComparison.OrdinalIgnoreCase);
    }

    internal static string NormalizeArmResourceId(string resourceId)
    {
        string normalized = resourceId.Trim();

        int queryIndex = normalized.IndexOf('?', StringComparison.Ordinal);
        if (queryIndex >= 0)
            normalized = normalized[..queryIndex];

        int subscriptionsIndex = normalized.IndexOf("/subscriptions/", StringComparison.OrdinalIgnoreCase);
        if (subscriptionsIndex >= 0)
            normalized = normalized[subscriptionsIndex..];
        else
        {
            subscriptionsIndex = normalized.IndexOf("subscriptions/", StringComparison.OrdinalIgnoreCase);
            if (subscriptionsIndex >= 0)
                normalized = normalized[subscriptionsIndex..];
        }

        normalized = normalized.ToLowerInvariant();

        while (normalized.Contains("//", StringComparison.Ordinal))
        {
            normalized = normalized.Replace("//", "/", StringComparison.Ordinal);
        }

        while (normalized.Length > 1 && normalized.EndsWith('/'))
        {
            normalized = normalized[..^1];
        }

        if (normalized.StartsWith("subscriptions/", StringComparison.Ordinal))
        {
            normalized = "/" + normalized;
        }

        return normalized;
    }
}
