using System.Text.Json;

using ArchLucid.Core.Findings;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Application.Analysis;

/// <summary>
///     Compares declaration property bags on topology nodes to scoped inventory rows (DX-04).
/// </summary>
public static class DeclarationInventoryContradictionAnalyzer
{
    private static readonly string[] TrackedLogicalPropertyNames =
    [
        DeclarationSecurityPropertyLogicalNames.PublicNetworkAccess,
        DeclarationSecurityPropertyLogicalNames.AllowBlobPublicAccess,
        DeclarationSecurityPropertyLogicalNames.HttpsOnly,
        DeclarationSecurityPropertyLogicalNames.MinimumTlsVersion,
        DeclarationSecurityPropertyLogicalNames.SslEnforcementEnabled,
        DeclarationSecurityPropertyLogicalNames.StorageEncrypted,
        DeclarationSecurityPropertyLogicalNames.NetworkAclDefaultAction,
        DeclarationSecurityPropertyLogicalNames.K8sPrivileged,
        DeclarationSecurityPropertyLogicalNames.K8sHostNetwork,
    ];

    public static IReadOnlyList<DeclarationInventoryContradictionMismatch> Analyze(
        InventoryTopologyCloudProvider cloudProvider,
        string resourcesJson,
        GraphSnapshot graphSnapshot)
    {
        ArgumentNullException.ThrowIfNull(graphSnapshot);
        ArgumentException.ThrowIfNullOrWhiteSpace(resourcesJson);

        Dictionary<string, JsonElement> inventoryRowsByResourceId = IndexInventoryRows(cloudProvider, resourcesJson);

        if (inventoryRowsByResourceId.Count == 0)
            return [];

        List<DeclarationInventoryContradictionMismatch> mismatches = [];
        string cloudLabel = cloudProvider.ToString();

        foreach (GraphNode node in graphSnapshot.GetNodesByType(GraphNodeTypes.TopologyResource))
        {
            string? topologyResourceId = TryReadTopologyResourceId(node, cloudProvider);

            if (string.IsNullOrWhiteSpace(topologyResourceId))
                continue;

            string normalizedResourceId = NormalizeResourceId(topologyResourceId, cloudProvider);

            if (!inventoryRowsByResourceId.TryGetValue(normalizedResourceId, out JsonElement inventoryRow))
                continue;

            if (!inventoryRow.TryGetProperty("properties", out JsonElement inventoryProperties))
                continue;

            string resourceLabel = string.IsNullOrWhiteSpace(node.Label)
                ? DeclarationInventoryContradictionHonestyCopy.ResourceNameNotStored
                : node.Label.Trim();

            foreach (string logicalName in TrackedLogicalPropertyNames)
            {
                if (!DeclarationSecurityPropertyKeyResolver.TryGet(
                        node.Properties,
                        logicalName,
                        out string? declarationKey,
                        out string? declarationValue)
                    || string.IsNullOrWhiteSpace(declarationValue))
                    continue;

                if (!DeclarationInventorySecurityPropertyInventoryReader.TryReadInventoryValue(
                        cloudProvider,
                        inventoryProperties,
                        logicalName,
                        out string? inventoryValue)
                    || string.IsNullOrWhiteSpace(inventoryValue))
                    continue;

                if (DeclarationInventorySecurityPropertyValueComparer.ValuesMatch(
                        DeclarationInventorySecurityPropertyValueComparer.ComparableToken(logicalName, declarationValue),
                        DeclarationInventorySecurityPropertyValueComparer.ComparableToken(logicalName, inventoryValue)))
                    continue;

                if (!DeclarationInventorySecurityPropertyInventoryReader.TryResolveSecurityTheme(
                        logicalName,
                        out string securityTheme))
                    continue;

                mismatches.Add(
                    new DeclarationInventoryContradictionMismatch(
                        node.NodeId,
                        resourceLabel,
                        ReadInventoryResourceId(inventoryRow, topologyResourceId),
                        declarationKey!,
                        declarationValue,
                        inventoryValue,
                        cloudLabel,
                        securityTheme));
            }
        }

        return mismatches;
    }

    private static Dictionary<string, JsonElement> IndexInventoryRows(
        InventoryTopologyCloudProvider cloudProvider,
        string resourcesJson)
    {
        try
        {
            using JsonDocument document = JsonDocument.Parse(resourcesJson);
            Dictionary<string, JsonElement> rows = new(StringComparer.OrdinalIgnoreCase);

            foreach (JsonElement row in InventoryResourcesJsonRowReader.EnumerateResourceRows(document.RootElement))
            {
                string? resourceId = TryReadInventoryRowResourceId(row);

                if (string.IsNullOrWhiteSpace(resourceId))
                    continue;

                rows[NormalizeResourceId(resourceId, cloudProvider)] = row.Clone();
            }

            return rows;
        }
        catch (JsonException)
        {
            return [];
        }
    }

    private static string ReadInventoryResourceId(JsonElement row, string? fallback) =>
        TryReadInventoryRowResourceId(row) ?? fallback ?? string.Empty;

    private static string? TryReadInventoryRowResourceId(JsonElement row)
    {
        if (row.ValueKind is not JsonValueKind.Object)
            return null;

        foreach (string propertyName in new[] { "resourceId", "name" })
        {
            foreach (JsonProperty property in row.EnumerateObject())
            {
                if (!string.Equals(property.Name, propertyName, StringComparison.OrdinalIgnoreCase))
                    continue;

                if (property.Value.ValueKind is not JsonValueKind.String)
                    continue;

                string? value = property.Value.GetString()?.Trim();

                if (!string.IsNullOrWhiteSpace(value))
                    return value;
            }
        }

        return null;
    }

    private static string? TryReadTopologyResourceId(GraphNode node, InventoryTopologyCloudProvider cloudProvider) =>
        cloudProvider switch
        {
            InventoryTopologyCloudProvider.Azure => GraphAzureInventoryReconciliationAnalyzer.TryReadTopologyResourceId(node),
            InventoryTopologyCloudProvider.Aws => GraphAwsInventoryReconciliationAnalyzer.TryReadTopologyResourceId(node),
            InventoryTopologyCloudProvider.Gcp => GraphGcpInventoryReconciliationAnalyzer.TryReadTopologyResourceId(node),
            _ => throw new ArgumentOutOfRangeException(nameof(cloudProvider), cloudProvider, null),
        };

    private static string NormalizeResourceId(string resourceId, InventoryTopologyCloudProvider cloudProvider) =>
        cloudProvider switch
        {
            InventoryTopologyCloudProvider.Azure => GraphAzureInventoryReconciliationAnalyzer.NormalizeArmResourceId(resourceId),
            InventoryTopologyCloudProvider.Aws => GraphAwsInventoryReconciliationAnalyzer.NormalizeAwsResourceId(resourceId),
            InventoryTopologyCloudProvider.Gcp => GraphGcpInventoryReconciliationAnalyzer.NormalizeGcpResourceId(resourceId),
            _ => throw new ArgumentOutOfRangeException(nameof(cloudProvider), cloudProvider, null),
        };
}
