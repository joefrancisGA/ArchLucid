using ArchLucid.ArtifactSynthesis.Models;

namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>
/// Steers dagre toward a viewport-shaped grid for unrelated peers using Mermaid invisible links (<c>~~~</c>).
/// In <c>flowchart TD</c>, <c>A ~~~ B</c> places B one rank below A; peers on the same rank sit side by side.
/// </summary>
internal static class DiagramPeerGridPlanner
{
    public static int ResolveColumnCount(int nodeCount)
    {
        if (nodeCount <= 1)
        {
            return DiagramAstFromGraphCompilerConstants.PeerGridMinColumns;
        }

        double raw = Math.Sqrt(nodeCount * DiagramAstFromGraphCompilerConstants.PeerGridAspectFactor);
        int columns = (int)Math.Ceiling(raw);

        return Math.Clamp(
            columns,
            DiagramAstFromGraphCompilerConstants.PeerGridMinColumns,
            DiagramAstFromGraphCompilerConstants.PeerGridMaxColumns);
    }

    /// <summary>
    /// Tighter column count for sparse packing components so small forests get 2+ ranks
    /// instead of one wide row (e.g. five components use three columns, not four).
    /// </summary>
    public static int ResolvePackingColumnCount(int nodeCount)
    {
        if (nodeCount <= 1)
        {
            return DiagramAstFromGraphCompilerConstants.PeerGridMinColumns;
        }

        int viewportColumns = ResolveColumnCount(nodeCount);
        int squareRootColumns = (int)Math.Ceiling(Math.Sqrt(nodeCount));

        return Math.Clamp(
            Math.Min(viewportColumns, squareRootColumns),
            DiagramAstFromGraphCompilerConstants.PeerGridMinColumns,
            Math.Min(DiagramAstFromGraphCompilerConstants.PeerGridMaxColumns, nodeCount));
    }

    public static IReadOnlyList<DiagramEdge> BuildGridLinks(IReadOnlyList<DiagramNode> orderedNodes)
    {
        return BuildGridLinks(orderedNodes, ResolveColumnCount(orderedNodes.Count), includeRowLinks: false);
    }

    /// <summary>
    /// Vertical plus horizontal <c>~~~</c> links steer both rank breaks and same-rank placement.
    /// Used by the zero-edge IDL-02 grid. Do not call this on visible-edge component heads —
    /// <see cref="DiagramComponentRowPlanner"/> owns that forest.
    /// </summary>
    public static IReadOnlyList<DiagramEdge> BuildDenseGridLinks(IReadOnlyList<DiagramNode> orderedNodes)
    {
        return BuildGridLinks(orderedNodes, ResolvePackingColumnCount(orderedNodes.Count), includeRowLinks: true);
    }

    private static IReadOnlyList<DiagramEdge> BuildGridLinks(
        IReadOnlyList<DiagramNode> orderedNodes,
        int columns,
        bool includeRowLinks)
    {
        ArgumentNullException.ThrowIfNull(orderedNodes);

        if (orderedNodes.Count <= 1)
        {
            return [];
        }

        HashSet<(string FromNodeId, string ToNodeId)> seen = new();
        List<DiagramEdge> links = [];

        for (int index = 0; index < orderedNodes.Count; index++)
        {
            int belowIndex = index + columns;

            if (belowIndex < orderedNodes.Count)
            {
                TryAddLayoutLink(links, seen, orderedNodes[index].NodeId, orderedNodes[belowIndex].NodeId);
            }

            if (!includeRowLinks)
            {
                continue;
            }

            int columnIndex = index % columns;

            if (columnIndex >= columns - 1)
            {
                continue;
            }

            int rightIndex = index + 1;

            if (rightIndex < orderedNodes.Count && rightIndex % columns != 0)
            {
                TryAddLayoutLink(links, seen, orderedNodes[index].NodeId, orderedNodes[rightIndex].NodeId);
            }
        }

        return links;
    }

    private static void TryAddLayoutLink(
        List<DiagramEdge> links,
        HashSet<(string FromNodeId, string ToNodeId)> seen,
        string fromNodeId,
        string toNodeId)
    {
        if (!seen.Add((fromNodeId, toNodeId)))
        {
            return;
        }

        links.Add(new DiagramEdge
        {
            FromNodeId = fromNodeId,
            ToNodeId = toNodeId,
            Label = string.Empty,
            IsLayoutOnly = true,
        });
    }
}
