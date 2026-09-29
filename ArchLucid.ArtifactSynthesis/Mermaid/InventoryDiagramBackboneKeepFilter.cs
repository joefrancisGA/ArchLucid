using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.Contracts.InfraEvidence.DiagramPeel;
using ArchLucid.Contracts.Persistence.Graph;

namespace ArchLucid.ArtifactSynthesis.Mermaid;

/// <summary>
/// Drops non-backbone topology so Full subscription can stay readable without
/// collapsing the whole subscription to resource-group nodes.
/// </summary>
internal static class InventoryDiagramBackboneKeepFilter
{
    public static GraphSnapshot Filter(GraphSnapshot graph, DiagramPeelCatalogSnapshot catalog)
    {
        ArgumentNullException.ThrowIfNull(graph);
        ArgumentNullException.ThrowIfNull(catalog);

        IReadOnlySet<string> excludedArmResourceTypes =
        [
            "Microsoft.Network/virtualNetworks/subnets",
        ];
        IReadOnlyList<GraphEdge> projectedPlacementEdges =
            DiagramHiddenSubnetVnetPlacementProjector.Project(
                graph,
                excludedArmResourceTypes,
                allowCrossResourceGroupVnetPlacement: true);

        List<GraphNode> keptNodes = graph.Nodes
            .Where(node =>
            {
                if (!DiagramAstGraphNodeClassifier.IsTopologyResource(node))
                {
                    return true;
                }

                string armType = DiagramAstGraphNodeClassifier.ReadArmType(node);

                return InventoryDiagramBackboneArmTypes.IsBackboneTopologyArmType(armType, catalog);
            })
            .ToList();

        HashSet<string> keptNodeIds = keptNodes
            .Select(node => node.NodeId)
            .ToHashSet(StringComparer.Ordinal);

        List<GraphEdge> keptEdges = graph.Edges
            .Where(edge => keptNodeIds.Contains(edge.FromNodeId) && keptNodeIds.Contains(edge.ToNodeId))
            .ToList();
        HashSet<string> keptEdgeKeys = keptEdges
            .Select(edge => $"{edge.FromNodeId}|{edge.ToNodeId}|{edge.EdgeType}")
            .ToHashSet(StringComparer.Ordinal);
        keptEdges.AddRange(projectedPlacementEdges.Where(edge =>
            keptNodeIds.Contains(edge.FromNodeId)
            && keptNodeIds.Contains(edge.ToNodeId)
            && keptEdgeKeys.Add($"{edge.FromNodeId}|{edge.ToNodeId}|{edge.EdgeType}")));

        return new GraphSnapshot
        {
            SchemaVersion = graph.SchemaVersion,
            GraphSnapshotId = graph.GraphSnapshotId,
            ContextSnapshotId = graph.ContextSnapshotId,
            RunId = graph.RunId,
            CreatedUtc = graph.CreatedUtc,
            Nodes = keptNodes,
            Edges = keptEdges,
            Warnings = graph.Warnings,
        };
    }
}
