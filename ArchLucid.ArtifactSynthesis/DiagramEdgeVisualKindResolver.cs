using ArchLucid.KnowledgeGraph;

namespace ArchLucid.ArtifactSynthesis;

public static class DiagramEdgeVisualKindResolver
{
    public static DiagramEdgeVisualKind From(string? provenanceKind, string? inferenceSource)
    {
        if (IsDeclared(provenanceKind, inferenceSource))
        {
            return DiagramEdgeVisualKind.Declared;
        }

        if (string.Equals(provenanceKind, "AiInference", StringComparison.OrdinalIgnoreCase))
        {
            return DiagramEdgeVisualKind.AiInferred;
        }

        if (string.Equals(provenanceKind, "DerivedFact", StringComparison.OrdinalIgnoreCase))
        {
            return DiagramEdgeVisualKind.Probable;
        }

        if (string.Equals(provenanceKind, "DeterministicInference", StringComparison.OrdinalIgnoreCase))
        {
            return DiagramEdgeVisualKind.Inferred;
        }

        return DiagramEdgeVisualKind.Observed;
    }

    public static bool IsDeclared(string? provenanceKind, string? inferenceSource)
    {
        if (string.Equals(provenanceKind, "HumanAssertion", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return string.Equals(
            inferenceSource,
            GraphEdgeInferenceSources.HumanDeclaredConnection,
            StringComparison.OrdinalIgnoreCase);
    }
}
