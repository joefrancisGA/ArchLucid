using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.KnowledgeGraph;

namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>Applies NR-05 orphaned and unconnected posture to standalone diagram nodes.</summary>
internal static class InventoryDiagramOrphanedStateApplier
{
    public static void Apply(
        DiagramAst ast,
        GraphSnapshot graph,
        IReadOnlyDictionary<string, string> graphToDiagramNodeId)
    {
        ArgumentNullException.ThrowIfNull(ast);
        ArgumentNullException.ThrowIfNull(graph);
        ArgumentNullException.ThrowIfNull(graphToDiagramNodeId);

        if (ast.Nodes.Count == 0)
        {
            return;
        }

        Dictionary<string, GraphNode> graphNodesById = graph.Nodes
            .GroupBy(node => node.NodeId, StringComparer.Ordinal)
            .ToDictionary(group => group.Key, group => group.First(), StringComparer.Ordinal);

        HashSet<string> citedEdgeNodeIds = ast.Edges
            .Where(edge => !edge.IsLayoutOnly
                && !string.Equals(
                    edge.InferenceSource,
                    GraphEdgeInferenceSources.InventoryResourceGroupCollocation,
                    StringComparison.OrdinalIgnoreCase))
            .SelectMany(edge => new[] { edge.FromNodeId, edge.ToNodeId })
            .ToHashSet(StringComparer.Ordinal);

        foreach (DiagramNode diagramNode in ast.Nodes)
        {
            if (string.IsNullOrWhiteSpace(diagramNode.SeedNodeId)
                || !graphNodesById.TryGetValue(diagramNode.SeedNodeId, out GraphNode? graphNode))
            {
                continue;
            }

            bool hasCitedDiagramEdges = citedEdgeNodeIds.Contains(diagramNode.NodeId);

            InventoryDiagramConnectionStateResult result = InventoryDiagramOrphanedStateClassifier.Classify(
                graphNode,
                graph,
                hasCitedDiagramEdges);

            if (result.State is null)
            {
                continue;
            }

            diagramNode.ConnectionState = result.State;
            diagramNode.ConnectionStateMessage = result.MissingRequirementMessage;
            diagramNode.UnresolvedRelationshipDetails = result.UnresolvedRelationshipDetails.ToList();
        }
    }
}
