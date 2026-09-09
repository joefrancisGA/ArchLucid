using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Diagram;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Analysis;

/// <summary>
///     AS-042 completeness gate — fire diagram-vs-declaration contradictions only when the drawing
///     asserts an explicit connector set inside a named trust boundary (not sketch / icon nags).
/// </summary>
public static class DiagramAssertedCompletenessPredicate
{
    private const string DiagramNodeIdPrefix = "diagram-node:";

    /// <summary>
    ///     True when the snapshot includes (1) a named structured-diagram trust boundary and
    ///     (2) at least one structured-parse edge between diagram topology participants.
    /// </summary>
    public static bool ClaimsCompleteness(GraphSnapshot graphSnapshot)
    {
        ArgumentNullException.ThrowIfNull(graphSnapshot);

        if (graphSnapshot.Nodes is null || graphSnapshot.Nodes.Count == 0)
        {
            return false;
        }

        bool hasNamedBoundary = graphSnapshot.Nodes.Any(IsNamedStructuredDiagramTrustBoundary);
        bool hasExplicitDiagramConnectors = HasExplicitStructuredParseConnectorSet(graphSnapshot);

        return hasNamedBoundary && hasExplicitDiagramConnectors;
    }

    public static bool IsDiagramTopologyParticipant(GraphNode node)
    {
        ArgumentNullException.ThrowIfNull(node);

        if (node.NodeId.StartsWith(DiagramNodeIdPrefix, StringComparison.Ordinal))
        {
            return true;
        }

        if (string.Equals(
                node.SourceType,
                StructuredDiagramGraphSourceTypes.StructuredDiagram,
                StringComparison.Ordinal))
        {
            return true;
        }

        if (node.Properties is not null
            && node.Properties.ContainsKey(StructuredDiagramGraphPropertyKeys.BoundDiagramNodeId))
        {
            return true;
        }

        return false;
    }

    private static bool IsNamedStructuredDiagramTrustBoundary(GraphNode node)
    {
        if (!string.Equals(node.NodeType, GraphNodeTypes.TrustBoundary, StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        if (string.Equals(
                node.SourceType,
                StructuredDiagramGraphSourceTypes.StructuredDiagramSubgraph,
                StringComparison.Ordinal)
            || string.Equals(
                node.SourceType,
                StructuredDiagramGraphSourceTypes.StructuredDiagramTrustBoundary,
                StringComparison.Ordinal))
        {
            return !string.IsNullOrWhiteSpace(node.Label);
        }

        return node.Properties is not null
            && node.Properties.ContainsKey(StructuredDiagramGraphPropertyKeys.TrustBoundaryLabel)
            && !string.IsNullOrWhiteSpace(node.Label);
    }

    private static bool HasExplicitStructuredParseConnectorSet(GraphSnapshot graphSnapshot)
    {
        if (graphSnapshot.Edges is null || graphSnapshot.Edges.Count == 0)
        {
            return false;
        }

        Dictionary<string, GraphNode> nodesById = graphSnapshot.Nodes
            .Where(static node => node is not null)
            .ToDictionary(static node => node.NodeId, StringComparer.Ordinal);

        foreach (GraphEdge edge in graphSnapshot.Edges)
        {
            if (!string.Equals(edge.InferenceSource, GraphEdgeInferenceSources.StructuredParse, StringComparison.Ordinal))
            {
                continue;
            }

            if (!nodesById.TryGetValue(edge.FromNodeId, out GraphNode? fromNode)
                || !nodesById.TryGetValue(edge.ToNodeId, out GraphNode? toNode))
            {
                continue;
            }

            if (IsDiagramTopologyParticipant(fromNode) && IsDiagramTopologyParticipant(toNode))
            {
                return true;
            }
        }

        return false;
    }
}
