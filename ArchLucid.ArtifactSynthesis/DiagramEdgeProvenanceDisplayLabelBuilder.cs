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

        return trimmedVerb;
    }
}
