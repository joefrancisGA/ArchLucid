namespace ArchLucid.Application.Analysis;

/// <summary>Search criteria for comparison history listing.</summary>
public sealed class ComparisonHistorySearchCriteria
{
    public string? ComparisonType
    {
        get;
        init;
    }

    public string? LeftRunId
    {
        get;
        init;
    }

    public string? RightRunId
    {
        get;
        init;
    }

    public string? LeftExportRecordId
    {
        get;
        init;
    }

    public string? RightExportRecordId
    {
        get;
        init;
    }

    public string? Label
    {
        get;
        init;
    }

    public DateTime? CreatedFromUtc
    {
        get;
        init;
    }

    public DateTime? CreatedToUtc
    {
        get;
        init;
    }

    public IReadOnlyList<string> Tags
    {
        get;
        init;
    } = [];

    public string SortBy
    {
        get;
        init;
    } = "createdUtc";

    public string SortDir
    {
        get;
        init;
    } = "desc";

    public string? Cursor
    {
        get;
        init;
    }

    public int Skip
    {
        get;
        init;
    }

    public int Limit
    {
        get;
        init;
    }

    public bool UseCursorPaging
    {
        get;
        init;
    }

    public DateTime? CursorCreatedUtc
    {
        get;
        init;
    }

    public string? CursorId
    {
        get;
        init;
    }
}

/// <summary>Result of comparison history search.</summary>
public sealed class ComparisonHistorySearchResult
{
    public required IReadOnlyList<ArchLucid.Contracts.Metadata.ComparisonRecord> Records
    {
        get;
        init;
    }

    public int Limit
    {
        get;
        init;
    }

    public int Skip
    {
        get;
        init;
    }

    public string? NextCursor
    {
        get;
        init;
    }
}
