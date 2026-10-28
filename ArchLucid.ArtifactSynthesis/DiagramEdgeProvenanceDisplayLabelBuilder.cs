namespace ArchLucid.ArtifactSynthesis;

public static class DiagramEdgeProvenanceDisplayLabelBuilder
{
    private const string RelationshipNotStored = "Relationship was not stored.";

    public static string Build(string humanizedVerb, DiagramEdgeVisualKind visualKind)
    {
        string trimmedVerb = humanizedVerb?.Trim() ?? string.Empty;

        if (trimmedVerb.Length == 0)
        {
            return RelationshipNotStored;
        }

        if (visualKind == DiagramEdgeVisualKind.Declared)
        {
            return $"declared · {trimmedVerb}";
        }

        if (visualKind == DiagramEdgeVisualKind.AiInferred)
        {
            return $"inferred · {trimmedVerb}";
        }

        if (visualKind == DiagramEdgeVisualKind.Probable)
        {
            return $"probable · {trimmedVerb}";
        }

        if (visualKind == DiagramEdgeVisualKind.Inferred)
        {
            if (trimmedVerb.StartsWith("Named in app settings", StringComparison.OrdinalIgnoreCase))
            {
                return trimmedVerb;
            }

            return $"likely · {trimmedVerb}";
        }

        if (visualKind == DiagramEdgeVisualKind.Unclassified)
        {
            return "Provenance was not stored.";
        }

        return trimmedVerb;
    }
}
