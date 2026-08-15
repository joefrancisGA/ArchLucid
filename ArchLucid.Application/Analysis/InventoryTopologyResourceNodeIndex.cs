using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Application.Analysis;

/// <summary>Cloud target for mapping inventory resource identifiers to topology graph nodes (TB-2220).</summary>
public enum InventoryTopologyCloudProvider
{
    Azure,
    Aws,
    Gcp,
}

/// <summary>
///     Maps normalized inventory resource identifiers to topology <see cref="GraphNodeTypes.TopologyResource" /> node ids (TB-2220).
/// </summary>
public sealed class InventoryTopologyResourceNodeIndex
{
    private readonly InventoryTopologyCloudProvider _cloudProvider;

    private readonly IReadOnlyDictionary<string, IReadOnlyList<string>> _nodeIdsByResourceId;

    private InventoryTopologyResourceNodeIndex(
        InventoryTopologyCloudProvider cloudProvider,
        IReadOnlyDictionary<string, IReadOnlyList<string>> nodeIdsByResourceId)
    {
        _cloudProvider = cloudProvider;
        _nodeIdsByResourceId = nodeIdsByResourceId;
    }

    public static InventoryTopologyResourceNodeIndex Build(
        GraphSnapshot graphSnapshot,
        InventoryTopologyCloudProvider cloudProvider)
    {
        ArgumentNullException.ThrowIfNull(graphSnapshot);

        Dictionary<string, List<string>> index = new(StringComparer.OrdinalIgnoreCase);

        foreach (GraphNode node in graphSnapshot.GetNodesByType(GraphNodeTypes.TopologyResource))
        {
            string? resourceId = TryReadTopologyResourceId(node, cloudProvider);

            if (string.IsNullOrWhiteSpace(resourceId))
                continue;

            string normalized = NormalizeResourceId(resourceId, cloudProvider);

            if (!index.TryGetValue(normalized, out List<string>? nodeIds))
            {
                nodeIds = [];
                index[normalized] = nodeIds;
            }

            nodeIds.Add(node.NodeId);
        }

        Dictionary<string, IReadOnlyList<string>> readOnlyIndex = index.ToDictionary(
            static pair => pair.Key,
            static pair => (IReadOnlyList<string>)pair.Value.AsReadOnly());

        return new InventoryTopologyResourceNodeIndex(cloudProvider, readOnlyIndex);
    }

    public IReadOnlyList<string> Resolve(string? inventoryResourceId)
    {
        if (string.IsNullOrWhiteSpace(inventoryResourceId))
            return [];

        string normalized = NormalizeResourceId(inventoryResourceId, _cloudProvider);

        return _nodeIdsByResourceId.TryGetValue(normalized, out IReadOnlyList<string>? nodeIds)
            ? nodeIds
            : [];
    }

    private static string? TryReadTopologyResourceId(GraphNode node, InventoryTopologyCloudProvider cloudProvider)
    {
        return cloudProvider switch
        {
            InventoryTopologyCloudProvider.Azure => GraphAzureInventoryReconciliationAnalyzer.TryReadTopologyResourceId(node),
            InventoryTopologyCloudProvider.Aws => GraphAwsInventoryReconciliationAnalyzer.TryReadTopologyResourceId(node),
            InventoryTopologyCloudProvider.Gcp => GraphGcpInventoryReconciliationAnalyzer.TryReadTopologyResourceId(node),
            _ => throw new ArgumentOutOfRangeException(nameof(cloudProvider), cloudProvider, null),
        };
    }

    private static string NormalizeResourceId(string resourceId, InventoryTopologyCloudProvider cloudProvider)
    {
        return cloudProvider switch
        {
            InventoryTopologyCloudProvider.Azure => GraphAzureInventoryReconciliationAnalyzer.NormalizeArmResourceId(resourceId),
            InventoryTopologyCloudProvider.Aws => GraphAwsInventoryReconciliationAnalyzer.NormalizeAwsResourceId(resourceId),
            InventoryTopologyCloudProvider.Gcp => GraphGcpInventoryReconciliationAnalyzer.NormalizeGcpResourceId(resourceId),
            _ => throw new ArgumentOutOfRangeException(nameof(cloudProvider), cloudProvider, null),
        };
    }
}
