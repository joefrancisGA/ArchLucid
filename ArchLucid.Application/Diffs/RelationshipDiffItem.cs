namespace ArchLucid.Application.Diffs;

public sealed class RelationshipDiffItem
{
    public string SourceId
    {
        get;
        set;
    } = string.Empty;

    public string TargetId
    {
        get;
        set;
    } = string.Empty;

    public string RelationshipType
    {
        get;
        set;
    } = string.Empty;

    public string? Description
    {
        get;
        set;
    }

    public string ToDisplayLine()
    {
        string typeLabel = string.IsNullOrWhiteSpace(RelationshipType)
            ? "Relationship type was not stored."
            : RelationshipType.Trim();
        string descriptionSuffix = string.IsNullOrWhiteSpace(Description)
            ? " Relationship description was not stored."
            : $" {Description.Trim()}";

        return $"{FormatEndpoint(SourceId)} -> {FormatEndpoint(TargetId)} ({typeLabel}).{descriptionSuffix}";
    }

    private static string FormatEndpoint(string endpointId) =>
        string.IsNullOrWhiteSpace(endpointId) ? "Relationship endpoint was not stored." : endpointId.Trim();
}
