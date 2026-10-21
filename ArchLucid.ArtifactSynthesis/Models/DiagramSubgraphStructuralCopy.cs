namespace ArchLucid.ArtifactSynthesis.Models;

/// <summary>
///     Deep structural copy for <see cref="DiagramSubgraph" />.
/// </summary>
public static class DiagramSubgraphStructuralCopy
{
    public static DiagramSubgraph Clone(DiagramSubgraph source)
    {
        ArgumentNullException.ThrowIfNull(source);

        return new DiagramSubgraph
        {
            SubgraphId = source.SubgraphId,
            Label = source.Label,
            ParentSubgraphId = source.ParentSubgraphId,
            OrderKey = source.OrderKey,
        };
    }

    public static DiagramSubgraph With(DiagramSubgraph source, Action<DiagramSubgraph> configure)
    {
        ArgumentNullException.ThrowIfNull(source);
        ArgumentNullException.ThrowIfNull(configure);

        DiagramSubgraph clone = Clone(source);
        configure(clone);

        return clone;
    }
}
