namespace ArchLucid.Contracts.Findings;

/// <summary>Metadata projection for GET /v1/architecture/review/{runId}/findings.</summary>
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

    public FindingHumanReviewStatus HumanReviewStatus
    {
        get;
        set;
    }

    public FindingDisposition? LatestDisposition
    {
        get;
        set;
    }

    public DateTimeOffset? RevisitDueUtc
    {
        get;
        set;
    }

    public string? Provider
    {
        get;
        set;
    }

    public string? ExternalKey
    {
        get;
        set;
    }

    public string? ExternalUrl
    {
        get;
        set;
    }

    /// <summary>Semicolon-separated <c>Provider:ExternalKey</c> pairs when multiple correlations exist.</summary>
    public string? ItsmLinkedTicketsSummary
    {
        get;
        set;
    }

    /// <summary><see langword="true" /> when at least one ITSM correlation exists for the tenant + finding.</summary>
    public bool TrackedExternally
    {
        get;
        set;
    }

    /// <summary>Human-readable external ticket summary for filters and badges without client-side correlation joins.</summary>
    public string? ExternalTrackingSummary
    {
        get;
        set;
    }
}
