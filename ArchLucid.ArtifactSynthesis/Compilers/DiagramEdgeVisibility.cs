using ArchLucid.ArtifactSynthesis.Models;

namespace ArchLucid.ArtifactSynthesis.Compilers;

internal static class DiagramEdgeVisibility
{
    public static IEnumerable<DiagramEdge> VisibleEdges(IReadOnlyList<DiagramEdge> edges)
    {
        return edges.Where(edge => !edge.IsLayoutOnly);
    }

    public static int CountVisible(IReadOnlyList<DiagramEdge> edges)
    {
        return edges.Count(edge => !edge.IsLayoutOnly);
    }
}
