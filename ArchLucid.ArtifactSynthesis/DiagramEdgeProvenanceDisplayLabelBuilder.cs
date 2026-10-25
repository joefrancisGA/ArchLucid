namespace ArchLucid.ArtifactSynthesis;

public static class DiagramEdgeProvenanceDisplayLabelBuilder
{
    public static string Build(string humanizedVerb, DiagramEdgeVisualKind visualKind)
    {
        string trimmedVerb = humanizedVerb?.Trim() ?? string.Empty;

        if (visualKind == DiagramEdgeVisualKind.Declared)
        {
            if (trimmedVerb.Length == 0)
            {
                return "declared";
            }

            return $"declared · {trimmedVerb}";
        }

        if (visualKind == DiagramEdgeVisualKind.AiInferred)
        {
            if (trimmedVerb.Length == 0)
            {
                return "inferred";
            }

            return $"inferred · {trimmedVerb}";
        }

        if (visualKind == DiagramEdgeVisualKind.Probable)
        {
            if (trimmedVerb.Length == 0)
            {
                return "probable";
            }

            return $"probable · {trimmedVerb}";
        }

        if (visualKind == DiagramEdgeVisualKind.Inferred)
        {
            if (trimmedVerb.Length == 0)
            {
                return "Relationship verb was not stored.";
            }

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
