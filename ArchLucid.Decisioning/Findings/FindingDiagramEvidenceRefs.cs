using ArchLucid.Core.Findings;
using ArchLucid.KnowledgeGraph.Diagram;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Findings;

/// <summary>
///     Resolves <c>diagram:</c> citations from diagram-origin graph nodes (AS-023).
/// </summary>
public static class FindingDiagramEvidenceRefs
{
    private const string DiagramNodeIdPrefix = "diagram-node:";

    public static void TryAppendFromNode(List<string> evidenceRefs, GraphNode node)
    {
        ArgumentNullException.ThrowIfNull(evidenceRefs);
        ArgumentNullException.ThrowIfNull(node);

        if (!TryResolveDiagramCitation(node, out string? evidenceItemId, out string? shapeOrEdgeId))
        {
            return;
        }

        FindingEvidenceRefs.TryAppendDiagramCitation(evidenceRefs, evidenceItemId, shapeOrEdgeId);
    }

    public static bool TryResolveDiagramCitation(
        GraphNode node,
        out string? evidenceItemId,
        out string? shapeOrEdgeId)
    {
        ArgumentNullException.ThrowIfNull(node);

        evidenceItemId = null;
        shapeOrEdgeId = null;

        if (node.Properties is not null
            && node.Properties.TryGetValue(
                StructuredDiagramGraphPropertyKeys.BoundDiagramNodeId,
                out string? boundDiagramNodeId)
            && !string.IsNullOrWhiteSpace(boundDiagramNodeId))
        {
            shapeOrEdgeId = boundDiagramNodeId.Trim();
            node.Properties.TryGetValue(StructuredDiagramGraphPropertyKeys.SourceEvidenceItemId, out evidenceItemId);
            return true;
        }

        if (string.Equals(
                node.SourceType,
                StructuredDiagramGraphSourceTypes.StructuredDiagram,
                StringComparison.Ordinal))
        {
            shapeOrEdgeId = ResolveDiagramShapeId(node);
            node.Properties?.TryGetValue(StructuredDiagramGraphPropertyKeys.SourceEvidenceItemId, out evidenceItemId);
            return !string.IsNullOrWhiteSpace(shapeOrEdgeId);
        }

        if (node.NodeId.StartsWith(DiagramNodeIdPrefix, StringComparison.Ordinal))
        {
            shapeOrEdgeId = ResolveDiagramShapeId(node);
            node.Properties?.TryGetValue(StructuredDiagramGraphPropertyKeys.SourceEvidenceItemId, out evidenceItemId);
            return !string.IsNullOrWhiteSpace(shapeOrEdgeId);
        }

        return false;
    }

    private static string? ResolveDiagramShapeId(GraphNode node)
    {
        if (!string.IsNullOrWhiteSpace(node.SourceId))
        {
            return node.SourceId.Trim();
        }

        if (node.NodeId.StartsWith(DiagramNodeIdPrefix, StringComparison.Ordinal))
        {
            return node.NodeId[DiagramNodeIdPrefix.Length..].Trim();
        }

        return null;
    }
}
