using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Inventory;

using InventoryDataFlowStageResolver = ArchLucid.KnowledgeGraph.Inventory.AzureInventoryDataFlowStageResolver;

namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>
///     Co-locates ADF pipeline sources and sinks on the Data Flow stage columns buyers expect.
/// </summary>
internal static class DiagramDataFlowEffectiveStageResolver
{
    public static IReadOnlyDictionary<string, string> BuildStageOverrides(
        IReadOnlyList<GraphNode> nodes,
        IReadOnlyList<GraphEdge> edges)
    {
        ArgumentNullException.ThrowIfNull(nodes);
        ArgumentNullException.ThrowIfNull(edges);

        Dictionary<string, GraphNode> nodesById = nodes.ToDictionary(node => node.NodeId, StringComparer.Ordinal);
        Dictionary<string, string> overrides = new(StringComparer.Ordinal);

        foreach (GraphEdge edge in edges)
        {
            if (!nodesById.TryGetValue(edge.FromNodeId, out GraphNode? fromNode))
            {
                continue;
            }

            if (!nodesById.TryGetValue(edge.ToNodeId, out GraphNode? toNode))
            {
                continue;
            }

            if (IsAdfReadsFrom(edge))
            {
                overrides[edge.ToNodeId] = AzureInventoryDataFlowStageNames.Source;

                if (IsDataFactoryNode(fromNode))
                {
                    overrides[edge.FromNodeId] = AzureInventoryDataFlowStageNames.Ingestion;
                }
            }

            if (IsAdfWritesTo(edge) && IsDataFactoryNode(fromNode))
            {
                overrides[edge.FromNodeId] = AzureInventoryDataFlowStageNames.Ingestion;
            }
        }

        return overrides;
    }

    public static string? ResolveStage(GraphNode node, IReadOnlyDictionary<string, string> stageOverrides)
    {
        ArgumentNullException.ThrowIfNull(node);
        ArgumentNullException.ThrowIfNull(stageOverrides);

        if (stageOverrides.TryGetValue(node.NodeId, out string? overriddenStage))
        {
            return overriddenStage;
        }

        return InventoryDataFlowStageResolver.Resolve(node);
    }

    private static bool IsDataFactoryNode(GraphNode node)
    {
        string armType = DiagramAstGraphNodeClassifier.ReadArmType(node);

        return armType.StartsWith("Microsoft.DataFactory/", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsAdfReadsFrom(GraphEdge edge)
    {
        return string.Equals(edge.EdgeType, AzureInventoryRelationshipAssociationTypes.AdfReadsFrom, StringComparison.OrdinalIgnoreCase)
            || string.Equals(edge.InferenceSource, GraphEdgeInferenceSources.InventoryAdfReadsFrom, StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsAdfWritesTo(GraphEdge edge)
    {
        return string.Equals(edge.EdgeType, AzureInventoryRelationshipAssociationTypes.AdfWritesTo, StringComparison.OrdinalIgnoreCase)
            || string.Equals(edge.InferenceSource, GraphEdgeInferenceSources.InventoryAdfWritesTo, StringComparison.OrdinalIgnoreCase);
    }
}
