namespace ArchLucid.ArtifactSynthesis.Models;

/// <summary>
///     Deep structural copy for <see cref="DiagramAst" />.
/// </summary>
public static class DiagramAstStructuralCopy
{
    public static DiagramAst Clone(DiagramAst source)
    {
        ArgumentNullException.ThrowIfNull(source);

        return new DiagramAst
        {
            Title = source.Title,
            Nodes = source.Nodes.Select(DiagramNodeStructuralCopy.Clone).ToList(),
            Edges = source.Edges.Select(DiagramEdgeStructuralCopy.Clone).ToList(),
            DropGateRows = source.DropGateRows.ToList(),
            Subgraphs = source.Subgraphs.Select(DiagramSubgraphStructuralCopy.Clone).ToList(),
            FlowchartDirection = source.FlowchartDirection,
            CaptionLines = source.CaptionLines.ToList(),
            LedgerDrops = source.LedgerDrops.ToList(),
        };
    }

    public static DiagramAst With(DiagramAst source, Action<DiagramAst> configure)
    {
        ArgumentNullException.ThrowIfNull(source);
        ArgumentNullException.ThrowIfNull(configure);

        DiagramAst clone = Clone(source);
        configure(clone);

        return clone;
    }
}
