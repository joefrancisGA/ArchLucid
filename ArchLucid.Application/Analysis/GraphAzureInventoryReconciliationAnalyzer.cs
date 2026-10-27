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

            string? relativeSegmentFromFlatProperties = TryGetRelativeArmSegmentFromProperties(node.Properties);
            string? flatSubscriptionId = TryGetSubscriptionIdFromProperties(node.Properties);

            string? fromSubscriptionProviderPathAndFlatResourceGroup =
                TryCombineSubscriptionProviderPathWithResourceGroup(
                    relativeSegmentFromFlatProperties,
                    TryGetResourceGroupNameFromProperties(node.Properties));

            if (LooksLikeArmResourceId(fromSubscriptionProviderPathAndFlatResourceGroup))
                return fromSubscriptionProviderPathAndFlatResourceGroup!.Trim();

            foreach (string propertyBagKey in new[]
                     {
                         "properties",
                         "attributes",
                         "configuration",
                         "supplementaryConfiguration",
                     })
            {
                if (!TryGetPropertyIgnoreCase(node.Properties, propertyBagKey, out string? serializedBag))
                    continue;

                if (TryReadArmResourceIdFromSerializedPropertyJson(serializedBag, out string? fromSerializedBag)
                    && LooksLikeArmResourceId(fromSerializedBag))
                    return fromSerializedBag!.Trim();

                if (TryReadArmResourceIdFromSerializedSubscriptionAndFlatRelativeSegment(
                        serializedBag,
                        relativeSegmentFromFlatProperties,
                        flatSubscriptionId,
                        out string? fromSplitBags)
                    && LooksLikeArmResourceId(fromSplitBags))
                    return fromSplitBags!.Trim();

                if (TryReadArmResourceIdFromSerializedResourceGroupAndSubscriptionProviderPath(
                        serializedBag,
                        relativeSegmentFromFlatProperties,
                        TryGetResourceGroupNameFromProperties(node.Properties),
                        out string? fromResourceGroupProviderPath)
                    && LooksLikeArmResourceId(fromResourceGroupProviderPath))
                    return fromResourceGroupProviderPath!.Trim();
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

    private static readonly string[] ArmResourceIdPropertyNames =
    [
        "resourceId",
        "id",
        "resourceName",
        "azureResourceId",
        "armResourceId",
        "selfLink",
        "tf.id",
        "tf.resource_id",
    ];

    private static bool TryReadArmResourceIdFromSerializedPropertyJson(string? propertyJson, out string? resourceId)
    {
        resourceId = null;
        string? resolved = null;

        if (!TryWithSerializedPropertyJsonObjectRoot(
                propertyJson,
                root =>
                {
                    string? candidate =
                        InventoryResourcesJsonRowReader.TryGetTrimmedString(root, ArmResourceIdPropertyNames);

                    if (LooksLikeArmResourceId(candidate))
                    {
                        resolved = candidate;
                        return true;
                    }

                    candidate = TryCombineSubscriptionIdAndRelativeResourceId(root);

                    if (!LooksLikeArmResourceId(candidate))
                        return false;

                    resolved = candidate;
                    return true;
                }))
            return false;

        resourceId = resolved;
        return true;
    }

    private static bool TryReadArmResourceIdFromSerializedSubscriptionAndFlatRelativeSegment(
        string? propertyJson,
        string? relativeSegment,
        string? flatSubscriptionId,
        out string? resourceId)
    {
        resourceId = null;

        if (string.IsNullOrWhiteSpace(relativeSegment) && string.IsNullOrWhiteSpace(flatSubscriptionId))
            return false;

        string? resolved = null;

        if (!TryWithSerializedPropertyJsonObjectRoot(
                propertyJson,
                root =>
                {
                    string? subscriptionId =
                        InventoryResourcesJsonRowReader.TryGetTrimmedString(root, ["subscriptionId"])
                        ?? flatSubscriptionId;

                    string? relative = relativeSegment ?? TryGetRelativeArmSegmentFromSerializedRoot(root);

                    string? candidate =
                        TryCombineSubscriptionIdAndRelativeResourceId(subscriptionId, relative);

                    if (!LooksLikeArmResourceId(candidate))
                        return false;

                    resolved = candidate;
                    return true;
                }))
            return false;

        resourceId = resolved;
        return true;
    }

    private static string? TryGetSubscriptionIdFromProperties(IReadOnlyDictionary<string, string> properties)
    {
        if (TryGetPropertyIgnoreCase(properties, "subscriptionId", out string? value)
            && !string.IsNullOrWhiteSpace(value))
            return value!.Trim();

        return null;
    }

    private static string? TryGetRelativeArmSegmentFromSerializedRoot(JsonElement root)
    {
        foreach (string propertyName in TopologyArmResourceIdPropertyKeys)
        {
            string? candidate = InventoryResourcesJsonRowReader.TryGetTrimmedString(root, [propertyName]);
            string? segment = NormalizeRelativeArmSegmentCandidate(candidate);

            if (string.IsNullOrWhiteSpace(segment))
                continue;

            if (TryParseSubscriptionProviderPathWithoutResourceGroup(segment, out _, out _))
                continue;

            return segment;
        }

        return null;
    }

    private static bool TryWithSerializedPropertyJsonObjectRoot(
        string? propertyJson,
        Func<JsonElement, bool> tryRead)
    {
        if (string.IsNullOrWhiteSpace(propertyJson))
            return false;

        string trimmed = propertyJson.Trim().TrimStart('\uFEFF');

        if (trimmed.Length < 2 || trimmed[0] is not ('{' or '['))
            return false;

        try
        {
            using JsonDocument document = JsonDocument.Parse(trimmed);
            JsonElement root = document.RootElement;

            if (root.ValueKind is JsonValueKind.Array
                && root.GetArrayLength() > 0
                && root[0].ValueKind is JsonValueKind.Object)
            {
                root = root[0];
            }

            if (root.ValueKind is not JsonValueKind.Object)
                return false;

            return tryRead(root);
        }
        catch (JsonException)
        {
            return false;
        }
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
        foreach (string propertyName in TopologyArmResourceIdPropertyKeys)
        {
            string? relativeId = InventoryResourcesJsonRowReader.TryGetTrimmedString(row, [propertyName]);
            string? segment = NormalizeRelativeArmSegmentCandidate(relativeId);

            if (!string.IsNullOrWhiteSpace(segment))
                return segment;
        }

        return null;
    }

    private static string? TryGetRelativeArmSegmentFromProperties(IReadOnlyDictionary<string, string> properties)
    {
        foreach (string key in TopologyArmResourceIdPropertyKeys)
        {
            if (!TryGetPropertyIgnoreCase(properties, key, out string? relativeId))
                continue;

            string? segment = NormalizeRelativeArmSegmentCandidate(relativeId);

            if (!string.IsNullOrWhiteSpace(segment))
                return segment;
        }

        return null;
    }

    private static string? NormalizeRelativeArmSegmentCandidate(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        string trimmed = value.Trim();

        if (LooksLikeArmResourceId(trimmed))
            return null;

        if (trimmed.Contains("management.azure.com/", StringComparison.OrdinalIgnoreCase))
        {
            int index = trimmed.IndexOf("management.azure.com/", StringComparison.OrdinalIgnoreCase);
            trimmed = trimmed[(index + "management.azure.com/".Length)..];
        }

        int queryIndex = trimmed.IndexOf('?', StringComparison.Ordinal);
        if (queryIndex >= 0)
            trimmed = trimmed[..queryIndex];

        return string.IsNullOrWhiteSpace(trimmed) ? null : trimmed;
    }

    private static readonly string[] ResourceGroupPropertyNames = ["resourceGroup", "resourceGroupName"];

    private static string? TryGetResourceGroupNameFromProperties(IReadOnlyDictionary<string, string> properties)
    {
        foreach (string key in ResourceGroupPropertyNames)
        {
            if (TryGetPropertyIgnoreCase(properties, key, out string? value)
                && !string.IsNullOrWhiteSpace(value))
                return value!.Trim();
        }

        return null;
    }

    private static bool TryReadArmResourceIdFromSerializedResourceGroupAndSubscriptionProviderPath(
        string? propertyJson,
        string? subscriptionProviderPathSegment,
        string? flatResourceGroupName,
        out string? resourceId)
    {
        resourceId = null;
        string? resolved = null;

        if (!TryWithSerializedPropertyJsonObjectRoot(
                propertyJson,
                root =>
                {
                    string? providerPathSegment = subscriptionProviderPathSegment
                        ?? TryGetSubscriptionProviderPathSegmentFromSerializedRoot(root);

                    string? resourceGroupName = flatResourceGroupName
                        ?? InventoryResourcesJsonRowReader.TryGetTrimmedString(root, ResourceGroupPropertyNames);

                    string? candidate =
                        TryCombineSubscriptionProviderPathWithResourceGroup(
                            providerPathSegment,
                            resourceGroupName);

                    if (!LooksLikeArmResourceId(candidate))
                        return false;

                    resolved = candidate;
                    return true;
                }))
            return false;

        resourceId = resolved;
        return true;
    }

    private static string? TryGetSubscriptionProviderPathSegmentFromSerializedRoot(JsonElement root)
    {
        foreach (string propertyName in TopologyArmResourceIdPropertyKeys)
        {
            string? candidate = InventoryResourcesJsonRowReader.TryGetTrimmedString(root, [propertyName]);
            string? segment = NormalizeRelativeArmSegmentCandidate(candidate);

            if (string.IsNullOrWhiteSpace(segment))
                continue;

            if (TryParseSubscriptionProviderPathWithoutResourceGroup(segment, out _, out _))
                return segment;
        }

        return null;
    }

    private static bool TryParseSubscriptionProviderPathWithoutResourceGroup(
        string? segment,
        out string? subscriptionId,
        out string? providerPath)
    {
        subscriptionId = null;
        providerPath = null;

        if (string.IsNullOrWhiteSpace(segment))
            return false;

        string trimmed = segment.Trim().TrimStart('/');

        if (!trimmed.StartsWith("subscriptions/", StringComparison.OrdinalIgnoreCase))
            return false;

        string afterSubscriptionPrefix = trimmed["subscriptions/".Length..];
        int slashAfterSubscriptionId = afterSubscriptionPrefix.IndexOf('/');

        if (slashAfterSubscriptionId < 0)
            return false;

        subscriptionId = afterSubscriptionPrefix[..slashAfterSubscriptionId];
        string remainder = afterSubscriptionPrefix[(slashAfterSubscriptionId + 1)..];

        if (!remainder.StartsWith("providers/", StringComparison.OrdinalIgnoreCase))
            return false;

        providerPath = remainder;
        return !string.IsNullOrWhiteSpace(subscriptionId);
    }

    private static string? TryCombineSubscriptionProviderPathWithResourceGroup(
        string? subscriptionProviderPathSegment,
        string? resourceGroupName)
    {
        if (!TryParseSubscriptionProviderPathWithoutResourceGroup(
                subscriptionProviderPathSegment,
                out string? subscriptionId,
                out string? providerPath)
            || string.IsNullOrWhiteSpace(resourceGroupName))
            return null;

        string combined =
            $"/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName.Trim()}/{providerPath}";

        return LooksLikeArmResourceId(combined) ? combined : null;
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

        if (trimmed.StartsWith("/subscriptions/", StringComparison.OrdinalIgnoreCase)
            || trimmed.StartsWith("subscriptions/", StringComparison.OrdinalIgnoreCase))
            return ContainsResourceGroupsSegment(trimmed);

        if (!trimmed.Contains("management.azure.com/", StringComparison.OrdinalIgnoreCase))
            return false;

        return (trimmed.Contains("/subscriptions/", StringComparison.OrdinalIgnoreCase)
                || trimmed.Contains("subscriptions/", StringComparison.OrdinalIgnoreCase))
               && ContainsResourceGroupsSegment(trimmed);
    }

    private static bool ContainsResourceGroupsSegment(string value) =>
        value.Contains("/resourceGroups/", StringComparison.OrdinalIgnoreCase)
        || value.Contains("/resourcegroups/", StringComparison.OrdinalIgnoreCase);

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
