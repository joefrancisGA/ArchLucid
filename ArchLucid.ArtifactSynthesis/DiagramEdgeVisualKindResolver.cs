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

        if (string.Equals(provenanceKind, "ObservedFact", StringComparison.OrdinalIgnoreCase))
        {
            return DiagramEdgeVisualKind.Observed;
        }

        if (string.IsNullOrWhiteSpace(provenanceKind) && string.IsNullOrWhiteSpace(inferenceSource))
        {
            return DiagramEdgeVisualKind.Unclassified;
        }

        if (!string.IsNullOrWhiteSpace(provenanceKind))
        {
            return DiagramEdgeVisualKind.Unclassified;
        }

        if (!string.IsNullOrWhiteSpace(inferenceSource)
            && !inferenceSource.StartsWith("inventory-", StringComparison.OrdinalIgnoreCase)
            && !inferenceSource.StartsWith("topology-", StringComparison.OrdinalIgnoreCase))
        {
            return DiagramEdgeVisualKind.Unclassified;
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
