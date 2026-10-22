using ArchLucid.Contracts.Serialization;

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

    private IReadOnlyList<RunFindingListItem> items = [];

    public IReadOnlyList<RunFindingListItem> Items
    {
        get => items;
        set => items = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

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
