namespace ArchLucid.ArtifactSynthesis.Layout;

public static class DiagramSubgraphLabelFormatter
{
    public const string GroupLabelNotStoredCaption = "Group label was not stored";

    public const string GroupLabelStoredEmptyCaption = "Group label was stored empty.";

    public static string FormatForDiagram(string? label)
    {
        if (label is null)
        {
            return GroupLabelNotStoredCaption;
        }

        if (label.Length == 0 || string.IsNullOrWhiteSpace(label))
        {
            return GroupLabelStoredEmptyCaption;
        }

        return label;
    }
}
