using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.Contracts.Persistence.Graph;

namespace ArchLucid.ArtifactSynthesis.Mermaid;

internal static class InventoryDiagramGraphPeelFilter
{
    public static GraphSnapshot Filter(
        GraphSnapshot graph,
        IReadOnlySet<string> excludedArmResourceTypes)
    {
        ArgumentNullException.ThrowIfNull(graph);
        ArgumentNullException.ThrowIfNull(excludedArmResourceTypes);

        if (excludedArmResourceTypes.Count == 0)
        {
            return graph;
        }

        List<GraphNode> keptNodes = graph.Nodes
            .Where(node =>
            {
                if (!DiagramAstGraphNodeClassifier.IsTopologyResource(node))
                {
                    return true;
                }

                string armType = DiagramAstGraphNodeClassifier.ReadArmType(node);

                return !excludedArmResourceTypes.Contains(armType);
            })
            .ToList();

        HashSet<string> keptNodeIds = keptNodes
            .Select(node => node.NodeId)
            .ToHashSet(StringComparer.Ordinal);

        List<GraphEdge> keptEdges = graph.Edges
            .Where(edge => keptNodeIds.Contains(edge.FromNodeId) && keptNodeIds.Contains(edge.ToNodeId))
            .ToList();

        return new GraphSnapshot
        {
            Nodes = keptNodes,
            Edges = keptEdges,
            Warnings = graph.Warnings,
        };
    }
}
