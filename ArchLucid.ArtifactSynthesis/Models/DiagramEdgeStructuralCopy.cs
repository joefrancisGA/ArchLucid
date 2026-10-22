namespace ArchLucid.ArtifactSynthesis.Models;

/// <summary>
///     Deep structural copy for <see cref="DiagramEdge" />.
/// </summary>
public static class DiagramEdgeStructuralCopy
{
    public static DiagramEdge Clone(DiagramEdge source)
    {
        ArgumentNullException.ThrowIfNull(source);

        return new DiagramEdge
        {
            FromNodeId = source.FromNodeId,
            ToNodeId = source.ToNodeId,
            Label = source.Label,
            IsLayoutOnly = source.IsLayoutOnly,
            ProvenanceKind = source.ProvenanceKind,
            InferenceSource = source.InferenceSource,
            DeclaredConnectionId = source.DeclaredConnectionId,
            IsDataFlowNsgBlocked = source.IsDataFlowNsgBlocked,
            DataFlowNsgAnnotationLabels = source.DataFlowNsgAnnotationLabels.ToList(),
            DataFlowNsgSupportingRuleDetails = source.DataFlowNsgSupportingRuleDetails.ToList(),
        };
    }

    public static DiagramEdge With(DiagramEdge source, Action<DiagramEdge> configure)
    {
        ArgumentNullException.ThrowIfNull(source);
        ArgumentNullException.ThrowIfNull(configure);

        DiagramEdge clone = Clone(source);
        configure(clone);

        return clone;
    }
}
