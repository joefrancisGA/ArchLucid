using ArchLucid.ArtifactSynthesis.Models;

namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>
///     Executive overflow rollups and unresolved policy nodes stay in Mermaid for the Nodes outline but are not painted on canvases.
/// </summary>
internal static class DiagramExecutiveOverflowCanvasExclusion
{
    public static bool IsCanvasRenderableNode(DiagramNode node)
    {
        ArgumentNullException.ThrowIfNull(node);

        return !node.IsExecutiveOverflow && !node.IsUnresolvedPolicyOutlineOnly;
    }

    public static HashSet<string> OverflowNodeIds(IReadOnlyList<DiagramNode> nodes)
    {
        ArgumentNullException.ThrowIfNull(nodes);

        return nodes
            .Where(node => node.IsExecutiveOverflow || node.IsUnresolvedPolicyOutlineOnly)
            .Select(node => node.NodeId)
            .ToHashSet(StringComparer.Ordinal);
    }

    public static IEnumerable<DiagramEdge> CanvasVisibleEdges(
        IReadOnlyList<DiagramNode> nodes,
        IReadOnlyList<DiagramEdge> edges)
    {
        ArgumentNullException.ThrowIfNull(nodes);
        ArgumentNullException.ThrowIfNull(edges);

        HashSet<string> overflowNodeIds = OverflowNodeIds(nodes);

        if (overflowNodeIds.Count == 0)
        {
            return DiagramEdgeVisibility.VisibleEdges(edges);
        }

        return DiagramEdgeVisibility.VisibleEdges(edges)
            .Where(edge => !overflowNodeIds.Contains(edge.FromNodeId) && !overflowNodeIds.Contains(edge.ToNodeId));
    }
}
