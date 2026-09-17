using ArchLucid.ArtifactSynthesis.Models;

namespace ArchLucid.ArtifactSynthesis;

public static class DiagramEdgeProvenanceDisplayLabelApplier
{
    public static void ApplyToVisibleEdges(DiagramAst ast)
    {
        ArgumentNullException.ThrowIfNull(ast);

        foreach (DiagramEdge edge in ast.Edges)
        {
            if (edge.IsLayoutOnly)
            {
                continue;
            }

            DiagramEdgeVisualKind visualKind = DiagramEdgeVisualKindResolver.From(edge.ProvenanceKind, edge.InferenceSource);

            if (visualKind == DiagramEdgeVisualKind.Observed)
            {
                continue;
            }

            edge.Label = DiagramEdgeProvenanceDisplayLabelBuilder.Build(edge.Label, visualKind);
        }
    }
}
