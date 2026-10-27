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
                         "fullResourceName",
                         "selfLink",
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

            if (TryGetPropertyIgnoreCase(node.Properties, "parent", out string? parent)
                && TryGetPropertyIgnoreCase(node.Properties, "name", out string? name)
                && TryCombineParentAndShortNameSegments(parent, name, out string? combined)
                && LooksLikeGcpResourceId(combined))
                return combined!.Trim();

            if (TryGetPropertyIgnoreCase(node.Properties, "ancestors", out string? ancestorsLiteral)
                && TryGetPropertyIgnoreCase(node.Properties, "name", out string? ancestorName)
                && InventoryResourcesJsonRowReader.TryGetLastTrimmedStringFromJsonArrayLiteral(ancestorsLiteral)
                    is string ancestorParent
                && TryCombineParentAndShortNameSegments(ancestorParent, ancestorName, out string? fromAncestors)
                && LooksLikeGcpResourceId(fromAncestors))
                return fromAncestors!.Trim();

            string? flatShortName = TryGetFlatShortNameSegment(node.Properties);

            foreach (string propertyBagKey in new[] { "properties", "attributes", "configuration" })
            {
                if (!TryGetPropertyIgnoreCase(node.Properties, propertyBagKey, out string? serializedBag))
                    continue;

                if (TryReadGcpResourceIdFromSerializedPropertyBag(serializedBag, flatShortName, out string? fromSerializedBag)
                    && LooksLikeGcpResourceId(fromSerializedBag))
                    return fromSerializedBag!.Trim();
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
            JsonElement root = document.RootElement;

            HashSet<string> ids = new(StringComparer.OrdinalIgnoreCase);

            foreach (JsonElement row in InventoryResourcesJsonRowReader.EnumerateResourceRows(root))
            {
                JsonElement effectiveRow = row;

                if (InventoryResourcesJsonRowReader.TryResolveIncludedResourceRow(root, row, out JsonElement includedRow))
                    effectiveRow = includedRow;

                string? resourceId = TryReadInventoryResourceId(effectiveRow);

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

    private static readonly string[] InventoryDirectIdPropertyNames =
    [
        "resourceName",
        "fullResourceName",
        "displayName",
        "gcpResourceId",
        "resourceId",
        "name",
        "id",
        "selfLink",
        "tf.id",
        "tf.resource_id",
    ];

    private static string? TryReadInventoryResourceId(JsonElement row)
    {
        foreach (string propertyName in InventoryDirectIdPropertyNames)
        {
            string? candidate = InventoryResourcesJsonRowReader.TryGetTrimmedString(row, [propertyName]);

            if (LooksLikeGcpResourceId(candidate))
                return candidate;
        }

        string? fromParent = TryCombineParentAndShortName(row);

        if (LooksLikeGcpResourceId(fromParent))
            return fromParent;

        return TryCombineAncestorsAndShortName(row);
    }

    private static string? TryCombineAncestorsAndShortName(JsonElement row)
    {
        string? parentPath = InventoryResourcesJsonRowReader.TryResolveAncestorsParentPath(row);

        if (string.IsNullOrWhiteSpace(parentPath))
            return null;

        string? name = InventoryResourcesJsonRowReader.TryGetTrimmedString(row, ["name", "resourceName"]);

        if (!TryCombineParentAndShortNameSegments(parentPath, name, out string? combined))
            return null;

        return LooksLikeGcpResourceId(combined) ? combined : null;
    }

    private static string? TryCombineParentAndShortName(JsonElement row)
    {
        string? parent = InventoryResourcesJsonRowReader.TryGetTrimmedString(row, ["parent"]);
        string? name = InventoryResourcesJsonRowReader.TryGetTrimmedString(row, ["name", "resourceName"]);

        if (!TryCombineParentAndShortNameSegments(parent, name, out string? combined))
            return null;

        return LooksLikeGcpResourceId(combined) ? combined : null;
    }

    private static string? TryGetFlatShortNameSegment(IReadOnlyDictionary<string, string> properties)
    {
        foreach (string key in new[] { "name", "resourceName" })
        {
            if (TryGetPropertyIgnoreCase(properties, key, out string? value)
                && !string.IsNullOrWhiteSpace(value)
                && !LooksLikeGcpResourceId(value))
                return value;
        }

        return null;
    }

    private static bool TryReadGcpResourceIdFromSerializedPropertyBag(
        string? propertyJson,
        string? flatShortName,
        out string? resourceId)
    {
        resourceId = null;
        string? resolved = null;

        if (!TryWithSerializedPropertyJsonObjectRoot(
                propertyJson,
                root =>
                {
                    foreach (string propertyName in new[]
                             {
                                 "gcpResourceId",
                                 "fullResourceName",
                                 "selfLink",
                                 "resourceName",
                                 "name",
                                 "resourceId",
                                 "id",
                                 "tf.id",
                                 "tf.resource_id",
                             })
                    {
                        string? candidate = InventoryResourcesJsonRowReader.TryGetTrimmedString(root, [propertyName]);

                        if (LooksLikeGcpResourceId(candidate))
                        {
                            resolved = candidate;
                            return true;
                        }
                    }

                    if (string.IsNullOrWhiteSpace(flatShortName))
                        return false;

                    string? parent = InventoryResourcesJsonRowReader.TryGetTrimmedString(root, ["parent"]);

                    if (TryCombineParentAndShortNameSegments(parent, flatShortName, out string? fromParent)
                        && LooksLikeGcpResourceId(fromParent))
                    {
                        resolved = fromParent;
                        return true;
                    }

                    string? ancestorParent = InventoryResourcesJsonRowReader.TryResolveAncestorsParentPath(root);

                    if (TryCombineParentAndShortNameSegments(ancestorParent, flatShortName, out string? fromAncestors)
                        && LooksLikeGcpResourceId(fromAncestors))
                    {
                        resolved = fromAncestors;
                        return true;
                    }

                    return false;
                }))
            return false;

        resourceId = resolved;
        return true;
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

    private static bool TryCombineParentAndShortNameSegments(
        string? parent,
        string? name,
        out string? combined)
    {
        combined = null;

        if (string.IsNullOrWhiteSpace(parent) || string.IsNullOrWhiteSpace(name))
            return false;

        string parentPath = NormalizeGcpResourceId(parent);
        string childSegment = name.Trim();

        if (childSegment.StartsWith("projects/", StringComparison.OrdinalIgnoreCase))
        {
            combined = childSegment;
            return true;
        }

        combined = parentPath.EndsWith('/')
            ? parentPath + childSegment
            : parentPath + "/" + childSegment;

        return true;
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
