namespace ArchLucid.Contracts.Findings;

/// <summary>Metadata projection for GET /v1/architecture/run/{runId}/findings.</summary>
public sealed class RunFindingListItem
{
    public Guid FindingRecordId
    {
        get;
        set;
    }

    public string FindingId
    {
        get;
        set;
    } = "";

    public string Severity
    {
        get;
        set;
    } = "";

    public string Category
    {
        get;
        set;
    } = "";

    public string FindingType
    {
        get;
        set;
    } = "";

    public string Title
    {
        get;
        set;
    } = "";

    public int SortOrder
    {
        get;
        set;
    }

    /// <summary>Lower values rank higher when <c>orderBy=priority</c>; null when not re-ranked.</summary>
    public int? PriorityRank
    {
        get;
        set;
    }
}
