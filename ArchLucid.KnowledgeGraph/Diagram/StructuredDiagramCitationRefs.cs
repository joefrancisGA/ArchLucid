namespace ArchLucid.KnowledgeGraph.Diagram;

/// <summary>
///     Citation ref grammar for diagram shapes and edges (AS-021 / AS-022).
/// </summary>
public static class StructuredDiagramCitationRefs
{
    public const string Prefix = "diagram:";

    public static string Format(string? evidenceItemId, string shapeOrEdgeId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(shapeOrEdgeId);

        string evidence = string.IsNullOrWhiteSpace(evidenceItemId) ? string.Empty : evidenceItemId.Trim();
        string shapeId = shapeOrEdgeId.Trim();

        return $"{Prefix}{evidence}:{shapeId}";
    }
}
