using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;

namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>
///     Draws CONTAINS between remaining canvas nodes whose ARM ids nest, even when the snapshot
///     stored a name-only parent prefix that is not a resource.
/// </summary>
internal static class DiagramArmParentChildEdgeHydrator
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
        Dictionary<string, string> diagramIdByNormalizedArmId = new(StringComparer.OrdinalIgnoreCase);
        HashSet<string> visibleDiagramIds = ast.Nodes
            .Select(node => node.NodeId)
            .ToHashSet(StringComparer.Ordinal);

        foreach (DiagramNode diagramNode in ast.Nodes)
        {
            if (string.IsNullOrWhiteSpace(diagramNode.SeedNodeId)
                || !graphNodesById.TryGetValue(diagramNode.SeedNodeId, out GraphNode? graphNode))
            {
                continue;
            }

            string armId = DiagramAstGraphNodeClassifier.ReadArmId(graphNode);

            if (string.IsNullOrWhiteSpace(armId))
            {
                continue;
            }

            diagramIdByNormalizedArmId[ArmResourceIdNormalizer.Normalize(armId)] = diagramNode.NodeId;
        }

        HashSet<string> visibleEdgeKeys = ast.Edges
            .Where(edge => !edge.IsLayoutOnly)
            .Select(edge => BuildEdgeKey(edge.FromNodeId, edge.ToNodeId, edge.Label))
            .ToHashSet(StringComparer.Ordinal);

        foreach (DiagramNode childDiagramNode in ast.Nodes)
        {
            if (string.IsNullOrWhiteSpace(childDiagramNode.SeedNodeId)
                || !graphNodesById.TryGetValue(childDiagramNode.SeedNodeId, out GraphNode? childGraphNode))
            {
                continue;
            }

            string childArmId = DiagramAstGraphNodeClassifier.ReadArmId(childGraphNode);

            if (!ArmResourceIdNormalizer.TryGetParentResourceId(childArmId, out string parentArmId))
            {
                continue;
            }

            if (!diagramIdByNormalizedArmId.TryGetValue(
                    ArmResourceIdNormalizer.Normalize(parentArmId),
                    out string? parentDiagramId))
            {
                continue;
            }

            if (!visibleDiagramIds.Contains(parentDiagramId)
                || string.Equals(parentDiagramId, childDiagramNode.NodeId, StringComparison.Ordinal))
            {
                continue;
            }

            string label = DiagramEdgeLabelHumanizer.ResolveDisplayLabel(
                GraphEdgeTypes.Contains,
                GraphEdgeTypes.Contains,
                GraphEdgeInferenceSources.InventoryExplicitParentChild);
            string edgeKey = BuildEdgeKey(parentDiagramId, childDiagramNode.NodeId, label);

            if (!visibleEdgeKeys.Add(edgeKey))
            {
                continue;
            }

            ast.Edges.Add(new DiagramEdge
            {
                FromNodeId = parentDiagramId,
                ToNodeId = childDiagramNode.NodeId,
                Label = label,
                ProvenanceKind = ProvenanceKind.ObservedFact.ToString(),
                InferenceSource = GraphEdgeInferenceSources.InventoryExplicitParentChild,
            });
        }
    }

    private static string BuildEdgeKey(string fromNodeId, string toNodeId, string? label)
    {
        return $"{fromNodeId}|{toNodeId}|{label ?? string.Empty}";
    }
}
