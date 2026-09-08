using System.Text.Json;

using ArchLucid.Application.Analysis;
using ArchLucid.Core.Findings;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Application.Findings.ProseAssumption;

/// <summary>
///     Compares mapped prose assumptions to scoped inventory rows on topology nodes (DX-55).
/// </summary>
public static class ProseAssumptionContradictionPass
{
    public static IReadOnlyList<ProseAssumptionContradictionMatch> Analyze(
        InventoryTopologyCloudProvider cloudProvider,
        string resourcesJson,
        GraphSnapshot graphSnapshot,
        IReadOnlyList<ProseAssumptionCandidate> candidates,
        int maxFindings)
    {
        ArgumentNullException.ThrowIfNull(graphSnapshot);
        ArgumentException.ThrowIfNullOrWhiteSpace(resourcesJson);
        ArgumentNullException.ThrowIfNull(candidates);

        if (maxFindings <= 0 || candidates.Count == 0)
            return [];

        Dictionary<string, JsonElement> inventoryRowsByResourceId = IndexInventoryRows(cloudProvider, resourcesJson);

        if (inventoryRowsByResourceId.Count == 0)
            return [];

        List<ProseAssumptionContradictionMatch> matches = [];
        string cloudLabel = cloudProvider.ToString();

        foreach (ProseAssumptionCandidate candidate in candidates)
        {
            if (matches.Count >= maxFindings)
                break;

            if (string.IsNullOrWhiteSpace(candidate.LogicalPropertyName)
                || string.IsNullOrWhiteSpace(candidate.ImpliedPropertyValue))
                continue;

            foreach (GraphNode node in graphSnapshot.GetNodesByType(GraphNodeTypes.TopologyResource))
            {
                if (matches.Count >= maxFindings)
                    break;

                string? topologyResourceId = TryReadTopologyResourceId(node, cloudProvider);

                if (string.IsNullOrWhiteSpace(topologyResourceId))
                    continue;

                string normalizedResourceId = NormalizeResourceId(topologyResourceId, cloudProvider);

                if (!inventoryRowsByResourceId.TryGetValue(normalizedResourceId, out JsonElement inventoryRow))
                    continue;

                if (!inventoryRow.TryGetProperty("properties", out JsonElement inventoryProperties))
                    continue;

                if (!DeclarationInventorySecurityPropertyInventoryReader.TryReadInventoryValue(
                        cloudProvider,
                        inventoryProperties,
                        candidate.LogicalPropertyName,
                        out string? inventoryValue)
                    || string.IsNullOrWhiteSpace(inventoryValue))
                    continue;

                if (DeclarationInventorySecurityPropertyValueComparer.ValuesMatch(
                        candidate.ImpliedPropertyValue,
                        inventoryValue))
                    continue;

                string resourceLabel = string.IsNullOrWhiteSpace(node.Label) ? node.NodeId : node.Label;
                string inventoryPropertyKey = ResolveInventoryPropertyKey(cloudProvider, candidate.LogicalPropertyName);

                matches.Add(new ProseAssumptionContradictionMatch
                {
                    Candidate = candidate,
                    GraphNodeId = node.NodeId,
                    ResourceLabel = resourceLabel,
                    InventoryResourceId = ReadInventoryResourceId(inventoryRow, topologyResourceId),
                    InventoryPropertyKey = inventoryPropertyKey,
                    InventoryValue = inventoryValue,
                    CloudLabel = cloudLabel,
                });
            }
        }

        return matches;
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

    private static string ResolveInventoryPropertyKey(
        InventoryTopologyCloudProvider cloudProvider,
        string logicalName)
    {
        return cloudProvider switch
        {
            InventoryTopologyCloudProvider.Azure when logicalName
                == DeclarationSecurityPropertyLogicalNames.PublicNetworkAccess => "publicNetworkAccess",
            InventoryTopologyCloudProvider.Aws when logicalName
                == DeclarationSecurityPropertyLogicalNames.PublicNetworkAccess => "publiclyAccessible",
            InventoryTopologyCloudProvider.Gcp when logicalName
                == DeclarationSecurityPropertyLogicalNames.PublicNetworkAccess => "ipv4Enabled",
            _ => logicalName,
        };
    }
}
