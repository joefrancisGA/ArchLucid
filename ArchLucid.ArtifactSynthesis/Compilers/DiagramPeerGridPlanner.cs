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

    public static IReadOnlyList<DiagramEdge> BuildGridLinks(IReadOnlyList<DiagramNode> orderedNodes)
    {
        ArgumentNullException.ThrowIfNull(orderedNodes);

        if (orderedNodes.Count <= 1)
        {
            return [];
        }

        int columns = ResolveColumnCount(orderedNodes.Count);
        List<DiagramEdge> links = [];

        for (int index = 0; index < orderedNodes.Count; index++)
        {
            int belowIndex = index + columns;

            if (belowIndex >= orderedNodes.Count)
            {
                continue;
            }

            links.Add(new DiagramEdge
            {
                FromNodeId = orderedNodes[index].NodeId,
                ToNodeId = orderedNodes[belowIndex].NodeId,
                Label = string.Empty,
                IsLayoutOnly = true,
            });
        }

        return links;
    }
}
