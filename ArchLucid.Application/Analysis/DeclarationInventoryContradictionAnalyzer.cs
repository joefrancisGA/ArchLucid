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

            string resourceLabel = string.IsNullOrWhiteSpace(node.Label) ? node.NodeId : node.Label;

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

                if (DeclarationInventorySecurityPropertyValueComparer.ValuesMatch(declarationValue, inventoryValue))
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
                        DeclarationInventorySecurityPropertyInventoryReader.ResolveSecurityTheme(logicalName)));
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

            if (document.RootElement.ValueKind is not JsonValueKind.Array)
                return [];

            Dictionary<string, JsonElement> rows = new(StringComparer.OrdinalIgnoreCase);

            foreach (JsonElement row in document.RootElement.EnumerateArray())
            {
                string? resourceId = ReadInventoryResourceId(row, null);

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

    private static string ReadInventoryResourceId(JsonElement row, string? fallback)
    {
        if (row.TryGetProperty("resourceId", out JsonElement resourceIdElement))
        {
            string? resourceId = resourceIdElement.GetString()?.Trim();

            if (!string.IsNullOrWhiteSpace(resourceId))
                return resourceId;
        }

        if (row.TryGetProperty("name", out JsonElement nameElement))
        {
            string? name = nameElement.GetString()?.Trim();

            if (!string.IsNullOrWhiteSpace(name))
                return name;
        }

        return fallback ?? string.Empty;
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
