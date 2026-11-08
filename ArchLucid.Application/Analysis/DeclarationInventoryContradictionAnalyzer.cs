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

            if (!TryReadPropertiesBag(inventoryRow, out JsonElement inventoryProperties))
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
                        ReadInventoryResourceId(inventoryRow, topologyResourceId, cloudProvider),
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
                string? resourceId = TryReadInventoryRowResourceId(row, cloudProvider);

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

    private static bool TryReadPropertiesBag(JsonElement row, out JsonElement properties)
    {
        if (row.ValueKind is JsonValueKind.Object)
        {
            if (row.TryGetProperty("properties", out properties)
                && properties.ValueKind is JsonValueKind.Object)
                return true;

            if (row.TryGetProperty("Properties", out properties)
                && properties.ValueKind is JsonValueKind.Object)
                return true;
        }

        properties = default;
        return false;
    }

    private static string ReadInventoryResourceId(
        JsonElement row,
        string? fallback,
        InventoryTopologyCloudProvider cloudProvider) =>
        TryReadInventoryRowResourceId(row, cloudProvider) ?? fallback ?? string.Empty;

    private static string? TryReadInventoryRowResourceId(
        JsonElement row,
        InventoryTopologyCloudProvider cloudProvider) =>
        cloudProvider switch
        {
            InventoryTopologyCloudProvider.Azure =>
                GraphAzureInventoryReconciliationAnalyzer.TryReadInventoryResourceId(row),
            InventoryTopologyCloudProvider.Aws =>
                GraphAwsInventoryReconciliationAnalyzer.TryReadInventoryResourceId(row),
            InventoryTopologyCloudProvider.Gcp =>
                GraphGcpInventoryReconciliationAnalyzer.TryReadInventoryResourceId(row),
            _ => throw new ArgumentOutOfRangeException(nameof(cloudProvider), cloudProvider, null),
        };

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
