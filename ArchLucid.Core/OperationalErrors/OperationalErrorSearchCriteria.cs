namespace ArchLucid.Core.OperationalErrors;

/// <summary>Query parameters for listing platform operational errors.</summary>
public sealed class OperationalErrorSearchCriteria
{
    public int MaxRows
    {
        get;
        set;
    } = 100;

    public DateTime? FromUtc
    {
        get;
        set;
    }

    public DateTime? ToUtc
    {
        get;
        set;
    }

    public string? Category
    {
        get;
        set;
    }

    public string? Source
    {
        get;
        set;
    }

    public int? MinStatusCode
    {
        get;
        set;
    }

    public Guid? TenantId
    {
        get;
        set;
    }

    public string? CorrelationId
    {
        get;
        set;
    }

    public string? Search
    {
        get;
        set;
    }
}
