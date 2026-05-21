namespace ArchLucid.Contracts.Findings;

/// <summary>Paginated findings metadata for a committed run.</summary>
public sealed class RunFindingsListResponse
{
    public string RunId
    {
        get;
        set;
    } = "";

    public string OrderBy
    {
        get;
        set;
    } = "sortOrder";

    public IReadOnlyList<RunFindingListItem> Items
    {
        get;
        set;
    } = [];

    public bool HasMore
    {
        get;
        set;
    }

    public int? NextCursorSortOrder
    {
        get;
        set;
    }

    public int? NextCursorPriorityRank
    {
        get;
        set;
    }

    public Guid? NextCursorFindingRecordId
    {
        get;
        set;
    }
}
