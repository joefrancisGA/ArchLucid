namespace ArchLucid.Contracts.User;

/// <summary>Recent operator route row for Working workspace continuity (IH-066).</summary>
public sealed class OperatorRecentViewEntryDto
{
    public string Href
    {
        get;
        set;
    } = string.Empty;

    public string Label
    {
        get;
        set;
    } = string.Empty;

    public string Kind
    {
        get;
        set;
    } = "page";

    public string VisitedAtUtc
    {
        get;
        set;
    } = string.Empty;

    public string? ArchitectureId
    {
        get;
        set;
    }

    public string? ParentArchitectureId
    {
        get;
        set;
    }
}
