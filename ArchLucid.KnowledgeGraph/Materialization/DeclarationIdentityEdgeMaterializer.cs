using ArchLucid.Contracts.Architecture;
using ArchLucid.KnowledgeGraph.Inference;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.KnowledgeGraph.Materialization;

/// <summary>
///     Links declaration-seeded <see cref="GraphNodeTypes.Actor" /> nodes to their source topology nodes (DX-03).
/// </summary>
public static class DeclarationIdentityEdgeMaterializer
{
    public static IReadOnlyList<GraphEdge> MaterializeFromDeclarationActors(IReadOnlyList<GraphNode> nodes)
    {
        ArgumentNullException.ThrowIfNull(nodes);

        List<GraphEdge> edges = [];

        foreach (GraphNode node in nodes)
        {
            if (!string.Equals(node.NodeType, GraphNodeTypes.Actor, StringComparison.OrdinalIgnoreCase))
                continue;

            if (!GraphNodePropertyReader.TryGetPropertyValue(
                    node.Properties,
                    "declarationSourceNodeId",
                    out string? sourceNodeId)
                || string.IsNullOrWhiteSpace(sourceNodeId))
                continue;

            string label = string.IsNullOrWhiteSpace(node.Label) ? node.NodeId : node.Label.Trim();

            edges.Add(
                GraphEdgeInferenceHelpers.CreateEdge(
                    node.NodeId,
                    sourceNodeId.Trim(),
                    GraphEdgeTypes.RelatesTo,
                    $"Actor linked to {label}",
                    1.0,
                    GraphEdgeInferenceSources.DeclarationIdentityActorLink));
        }

        return edges;
    }
}
